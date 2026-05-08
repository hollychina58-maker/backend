import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDatabaseAvailable, initializeDatabase } from '../../../../lib/db';
import { getCorsHeaders } from '../../../../lib/cors';
import { requireAuth } from '../../../../lib/auth-middleware';

const LANGUAGES = ['en', 'zh', 'ru', 'ar', 'fa', 'la'];

// YAML-style multi-language frontmatter parser
// Format:
// ---
// meta:
//   slug: my-post
//   author: Admin
//   date: 2026-05-06
//   tags: [IMU, Sensor]
//   cover_image: https://example.com/image.jpg
//   published: true
//
// content:
//   en:
//     title: Title in English
//     excerpt: Excerpt in English
//     body: |
//       # Markdown content in English
//       ...
//   zh:
//     title: 中文标题
//     excerpt: 中文摘要
//     body: |
//       # 中文Markdown内容
//       ...
// ---
// Markdown body (fallback for simple files)
function parseMultiLangFrontmatter(fileContent: string): {
  meta: Record<string, any>;
  content: Record<string, { title: string; excerpt: string; content: string }>;
  body: string;
} {
  const meta: Record<string, any> = {};
  const content: Record<string, { title: string; excerpt: string; content: string }> = {};
  let body = fileContent;

  const lines = fileContent.split('\n');
  let inFrontmatter = false;
  const frontmatterLines: string[] = [];

  // Phase 1: Extract frontmatter block
  for (const line of lines) {
    if (line.trim() === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
      } else {
        // End of frontmatter
        break;
      }
    } else if (inFrontmatter) {
      frontmatterLines.push(line);
    }
  }

  // Phase 2: Parse frontmatter with a simple state machine
  // State: which section (meta/content), which language, which field, collecting body or not
  let section: 'meta' | 'content' | 'none' = 'none';
  let lang: string = '';
  let field: 'title' | 'excerpt' | 'body' | '' = '';
  let bodyIndent: number = 0;
  const bodyLines: string[] = [];

  for (let i = 0; i < frontmatterLines.length; i++) {
    const rawLine = frontmatterLines[i];
    const line = rawLine;
    const trimmed = line.trim();
    const indent = line.length - line.trimStart().length;

    // Check for section-level headers (meta:, content:)
    if (indent === 0 && (trimmed === 'meta:' || trimmed === 'content:')) {
      section = trimmed === 'meta:' ? 'meta' : 'content';
      lang = '';
      field = '';
      continue;
    }

    // Check for language headers (en:, zh:, ru:, etc.) - only at indent 2 within content section
    if (section === 'content' && indent === 2) {
      const langMatch = LANGUAGES.find(l => trimmed === l + ':');
      if (langMatch) {
        // Save previous language's body if any
        if (lang && field === 'body' && bodyLines.length > 0) {
          content[lang].content = bodyLines.join('\n').trimEnd();
        }
        lang = langMatch;
        content[lang] = { title: '', excerpt: '', content: '' };
        field = '';
        continue;
      }
    }

    // Check for field headers (title:, excerpt:, body:) at indent 4
    if (section === 'content' && lang && indent === 4) {
      if (trimmed.startsWith('title:') || trimmed.startsWith('excerpt:') || trimmed.startsWith('body:')) {
        // Save previous field's body if any
        if (field === 'body' && bodyLines.length > 0) {
          content[lang].content = bodyLines.join('\n').trimEnd();
          bodyLines.length = 0;
        }

        const colonIdx = trimmed.indexOf(':');
        field = trimmed.slice(0, colonIdx) as 'title' | 'excerpt' | 'body';
        const value = trimmed.slice(colonIdx + 1).trim();

        if (field === 'body') {
          if (value === '|') {
            // Start multi-line body collection
            field = 'body';
            bodyIndent = indent;
          } else {
            // Single-line body
            content[lang].content = value;
            field = '';
          }
        } else if (field === 'title' || field === 'excerpt') {
          // title or excerpt
          (content[lang] as Record<string, string>)[field] = value;
        }
        continue;
      }
    }

    // If we're collecting a multi-line body
    if (section === 'content' && lang && field === 'body' && bodyIndent > 0) {
      // Blank line - always include in body
      if (trimmed === '') {
        bodyLines.push('');
        continue;
      }

      // Dedented to field level (indent <= bodyIndent - 2) - end of body
      if (indent <= bodyIndent - 2) {
        content[lang].content = bodyLines.join('\n').trimEnd();
        bodyLines.length = 0;
        field = '';
        bodyIndent = 0;
        // Don't continue - let this line be re-processed by field detection
      } else {
        // Content line - strip leading indent (the bodyIndent indentation)
        const contentIndent = indent - bodyIndent;
        const deindented = line.slice(bodyIndent);
        bodyLines.push(deindented);
      }
    }
  }

  // Save last body's content
  if (lang && field === 'body' && bodyLines.length > 0) {
    content[lang].content = bodyLines.join('\n').trimEnd();
  }

  // If no multi-language content found, check for simple format
  if (Object.keys(content).length === 0) {
    const { data, body: simpleBody } = parseSimpleFrontmatter(fileContent);
    body = simpleBody;

    meta.slug = data.slug || '';
    meta.author = data.author || 'Admin';
    meta.date = data.date || new Date().toISOString().split('T')[0];
    meta.tags = data.tags ? data.tags.split(',').map(t => t.trim()) : [];
    meta.cover_image = data.cover_image || data.coverImage || '';
    meta.published = data.published === 'true' || data.published === '1';

    for (const langKey of LANGUAGES) {
      const title = data[`title.${langKey}`] || data[`title_${langKey}`] || '';
      const excerpt = data[`excerpt.${langKey}`] || data[`excerpt_${langKey}`] || '';
      if (title) {
        content[langKey] = { title, excerpt, content: simpleBody };
      }
    }

    if (Object.keys(content).length === 0 && data.title) {
      content['en'] = { title: data.title, excerpt: data.excerpt || simpleBody.slice(0, 200), content: simpleBody };
    }
  }

  return { meta, content, body: body.trim() };
}

// Parse simple key-value frontmatter
function parseSimpleFrontmatter(content: string): { data: Record<string, string>; body: string } {
  const lines = content.split('\n');
  const data: Record<string, string> = {};
  let body = content;
  let inFrontmatter = false;
  const frontmatterLines: string[] = [];

  for (const line of lines) {
    if (line.trim() === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
      } else {
        inFrontmatter = false;
        body = lines.slice(lines.indexOf(line) + 1).join('\n').trim();
        break;
      }
    } else if (inFrontmatter) {
      frontmatterLines.push(line);
    }
  }

  for (const line of frontmatterLines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      data[key] = value;
    }
  }

  return { data, body };
}

export async function OPTIONS(request: NextRequest) {
  const headers = getCorsHeaders(request.headers.get('origin'));
  return new NextResponse(null, { status: 204, headers });
}

export async function POST(request: NextRequest) {
  const headers = getCorsHeaders(request.headers.get('origin'));
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    await initializeDatabase();
  } catch (error) {
    console.error('[Blog Import] Database initialization failed:', error);
    return NextResponse.json({ success: false, error: 'Database initialization failed' }, { status: 500, headers });
  }

  if (!isDatabaseAvailable()) {
    return NextResponse.json({ success: false, error: 'Database not available' }, { status: 503, headers });
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500, headers });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400, headers });
    }

    if (!file.name.endsWith('.md')) {
      return NextResponse.json({ success: false, error: 'Only .md files are supported' }, { status: 400, headers });
    }

    const fileContent = await file.text();
    const { meta, content: contentByLang, body } = parseMultiLangFrontmatter(fileContent);

    // Validate multi-language content
    const hasMultiLang = Object.keys(contentByLang).filter(k => LANGUAGES.includes(k)).length > 0;
    if (!hasMultiLang) {
      return NextResponse.json({
        success: false,
        error: 'Multi-language content required. Please provide content for at least one language (en, zh, ru, ar, fa, or la).'
      }, { status: 400, headers });
    }

    // Extract meta fields
    const slug = meta.slug || file.name.replace('.md', '').toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const author = meta.author || 'Admin';
    const date = meta.date || new Date().toISOString().split('T')[0];
    const tags = meta.tags || [];
    const coverImage = meta.cover_image || meta.coverImage || '';
    const published = meta.published === true || meta.published === 'true';
    const readTime = meta.read_time || meta.readTime || Math.max(1, Math.ceil(body.split(/\s+/).length / 200)) + ' min';

    // Fill missing languages with placeholder
    for (const lang of LANGUAGES) {
      if (!contentByLang[lang]) {
        contentByLang[lang] = {
          title: contentByLang['en']?.title || contentByLang['zh']?.title || slug,
          excerpt: '',
          content: body,
        };
      }
    }

    // Check if post with same slug exists
    const existing = await sql`SELECT id FROM blog_posts WHERE LOWER(slug) = LOWER(${slug})`;
    if (existing.length > 0) {
      return NextResponse.json({ success: false, error: `Post with slug "${slug}" already exists` }, { status: 409, headers });
    }

    // Insert into database
    const id = `BP-${Date.now()}`;
    const now = new Date().toISOString();

    await sql`
      INSERT INTO blog_posts (id, slug, cover_image, tags, author, date, read_time, published, content, created_at, updated_at)
      VALUES (
        ${id},
        ${slug},
        ${coverImage},
        ${JSON.stringify(tags)}::jsonb,
        ${author},
        ${date},
        ${readTime},
        ${published},
        ${JSON.stringify(contentByLang)}::jsonb,
        ${now},
        ${now}
      )
    `;

    const langCount = Object.keys(contentByLang).length;
    return NextResponse.json({
      success: true,
      data: { id, slug },
      message: `Imported: ${slug} (${langCount} languages)`
    }, { status: 201, headers });

  } catch (error) {
    console.error('[Blog Import] Error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: 'Failed to import markdown file: ' + message }, { status: 500, headers });
  }
}
