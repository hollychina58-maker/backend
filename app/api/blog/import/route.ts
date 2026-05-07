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
  const frontmatterLines: string[] = [];
  let inFrontmatter = false;
  let inContentSection = false;
  let currentLang = '';
  let currentField = '';
  let contentBuffer: string[] = [];
  let metaBuffer: string[] = [];

  // Simple state machine parser
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Start or end of frontmatter
    if (line.trim() === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
        metaBuffer = [];
        contentBuffer = [];
      } else {
        // End frontmatter
        inFrontmatter = false;
        break;
      }
    } else if (inFrontmatter) {
      metaBuffer.push(line);
    } else {
      // Body after frontmatter
      body += '\n' + line;
    }
  }

  // Parse meta section
  let inMeta = false;
  let inContent = false;
  let currentSection = '';
  let pendingBodyMultiLine = false; // true when currentField='body' and value ends with '|'
  let bodyIndent = 0;
  const bodyLines: string[] = [];

  for (const line of metaBuffer) {
    const trimmed = line.trim();
    const lineIndent = line.length - line.trimStart().length;

    // Language headers under content — check BEFORE body continuation logic
    // because indented language keys (e.g. "  zh:") match body-continuation indent rules
    if (inContent && LANGUAGES.some(l => trimmed === l + ':')) {
      console.log('[Import] Language header:', trimmed, 'pendingBodyMultiLine:', pendingBodyMultiLine, 'bodyLines count:', bodyLines.length);
      // Finalize any pending body before switching language
      if (pendingBodyMultiLine && currentLang && content[currentLang]) {
        console.log('[Import] Finalizing body for', currentLang, 'with', bodyLines.length, 'lines, first 50 chars:', bodyLines[0]?.slice(0, 50));
        content[currentLang].content = bodyLines.join('\n').trimEnd();
      }
      pendingBodyMultiLine = false;
      bodyLines.length = 0;
      currentLang = trimmed.slice(0, -1);
      content[currentLang] = { title: '', excerpt: '', content: '' };
      currentField = '';
      continue;
    }

    // Section headers
    if (trimmed === 'meta:') {
      inMeta = true;
      inContent = false;
      continue;
    }
    if (trimmed === 'content:') {
      inMeta = false;
      inContent = true;
      continue;
    }

    // If collecting multi-line body content
    if (pendingBodyMultiLine) {
      // Blank line — always continue (YAML multi-line scalars allow blank lines at any indent)
      if (trimmed === '') {
        console.log('[Import] Body BLANK LINE at indent', lineIndent, 'bodyIndent:', bodyIndent);
        bodyLines.push('');
        continue;
      }
      // Closing frontmatter delimiter at indent 0 — finalize body and exit frontmatter early
      // This MUST be checked before the lineIndent >= bodyIndent condition since --- at indent 0 always fails that check
      if (line.trim() === '---') {
        console.log('[Import] Closing frontmatter --- found, finalizing body and breaking');
        if (currentLang && content[currentLang]) {
          console.log('[Import] Finalizing body for', currentLang, 'with', bodyLines.length, 'lines');
          content[currentLang].content = bodyLines.join('\n').trimEnd();
        }
        pendingBodyMultiLine = false;
        bodyLines.length = 0;
        break;
      }
      // Check if this line continues the body (must be indented at or past body indent)
      // and is NOT a language header, field, or section marker
      console.log('[Import] Body check: lineIndent', lineIndent, '>= bodyIndent', bodyIndent, '?', lineIndent >= bodyIndent, '| trimmed:', trimmed?.slice(0, 30));
      if (lineIndent >= bodyIndent && !LANGUAGES.some(l => trimmed === l + ':') && !trimmed.startsWith('title:') && !trimmed.startsWith('excerpt:') && !trimmed.startsWith('body:') && trimmed !== 'meta:' && trimmed !== 'content:') {
        // Continuation of body — remove leading indent and store
        const deindented = lineIndent > bodyIndent ? line.slice(bodyIndent) : line.trimStart();
        console.log('[Import] Body COLLECTING (count:', bodyLines.length + 1, '):', deindented?.slice(0, 40));
        bodyLines.push(deindented === '' ? '' : deindented);
        continue;
      } else {
        // New field/section reached — finalize the accumulated body
        console.log('[Import] Body continuation STOPPED at line:', trimmed?.slice(0, 40), 'lineIndent:', lineIndent, 'bodyIndent:', bodyIndent);
        if (currentLang && content[currentLang]) {
          console.log('[Import] Finalizing body for', currentLang, 'with', bodyLines.length, 'lines');
          content[currentLang].content = bodyLines.join('\n').trimEnd();
        }
        pendingBodyMultiLine = false;
        bodyLines.length = 0;
      }
    }

    // Field parsing
    if (trimmed.startsWith('title:') || trimmed.startsWith('excerpt:') || trimmed.startsWith('body:')) {
      // First: if we were collecting a multi-line body for this language, finalize it
      if (pendingBodyMultiLine && currentLang && content[currentLang]) {
        console.log('[Import] Finalizing pending body for', currentLang, 'at field', trimmed, 'with', bodyLines.length, 'lines');
        content[currentLang].content = bodyLines.join('\n').trimEnd();
        pendingBodyMultiLine = false;
        bodyLines.length = 0;
      }

      const colonIdx = trimmed.indexOf(':');
      currentField = trimmed.slice(0, colonIdx).trim();
      const value = trimmed.slice(colonIdx + 1).trim();
      console.log('[Import] Field:', currentField, '=', value?.slice(0, 30), 'pendingBodyMultiLine:', pendingBodyMultiLine, 'currentLang:', currentLang);

      if (value && currentLang) {
        if (currentField === 'body') {
          if (value === '|' || value === '') {
            // Multi-line YAML block scalar — collect continuation lines
            pendingBodyMultiLine = true;
            bodyIndent = lineIndent;
            bodyLines.length = 0;
            console.log('[Import] Starting multi-line body collection for', currentLang, 'at indent', bodyIndent);
          } else {
            content[currentLang].content = value;
          }
        } else if (currentField === 'title' || currentField === 'excerpt') {
          (content[currentLang] as any)[currentField] = value;
        }
      }

      if (value && inMeta) {
        if (trimmed.startsWith('tags:')) {
          // Parse array syntax: [IMU, Sensor]
          meta.tags = value.replace(/[\[\]]/g, '').split(',').map(t => t.trim()).filter(Boolean);
        } else {
          const key = trimmed.slice(0, trimmed.indexOf(':')).trim();
          meta[key] = value;
        }
      }
    }
  }

  // Finalize any remaining multi-line body
  if (pendingBodyMultiLine && currentLang && content[currentLang]) {
    content[currentLang].content = bodyLines.join('\n').trimEnd();
  }

  // If no multi-language content found, check for simple format
  if (Object.keys(content).length === 0) {
    // Try simple frontmatter with single title/excerpt
    const { data, body: simpleBody } = parseSimpleFrontmatter(fileContent);
    body = simpleBody;

    // Extract meta
    meta.slug = data.slug || '';
    meta.author = data.author || 'Admin';
    meta.date = data.date || new Date().toISOString().split('T')[0];
    meta.tags = data.tags ? data.tags.split(',').map(t => t.trim()) : [];
    meta.cover_image = data.cover_image || data.coverImage || '';
    meta.published = data.published === 'true' || data.published === '1';

    // If we have language-prefixed fields, parse them
    for (const lang of LANGUAGES) {
      const title = data[`title.${lang}`] || data[`title_${lang}`] || '';
      const excerpt = data[`excerpt.${lang}`] || data[`excerpt_${lang}`] || '';

      if (title) {
        content[lang] = {
          title,
          excerpt,
          content: simpleBody,
        };
      }
    }

    // If still no multi-language content, use single content as source for all
    if (Object.keys(content).length === 0 && data.title) {
      content['en'] = {
        title: data.title,
        excerpt: data.excerpt || simpleBody.slice(0, 200),
        content: simpleBody,
      };
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
    return NextResponse.json(
      { success: false, error: 'Database initialization failed' },
      { status: 500, headers }
    );
  }

  if (!isDatabaseAvailable()) {
    return NextResponse.json(
      { success: false, error: 'Database not available' },
      { status: 503, headers }
    );
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json(
      { success: false, error: 'Database connection failed' },
      { status: 500, headers }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400, headers }
      );
    }

    if (!file.name.endsWith('.md')) {
      return NextResponse.json(
        { success: false, error: 'Only .md files are supported' },
        { status: 400, headers }
      );
    }

    const fileContent = await file.text();
    const { meta, content: contentByLang, body } = parseMultiLangFrontmatter(fileContent);

    // Validate multi-language content
    const hasMultiLang = Object.keys(contentByLang).filter(k => LANGUAGES.includes(k)).length > 0;
    if (!hasMultiLang) {
      return NextResponse.json(
        {
          success: false,
          error: 'Multi-language content required. Please provide content for at least one language (en, zh, ru, ar, fa, or la).'
        },
        { status: 400, headers }
      );
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
      return NextResponse.json(
        { success: false, error: `Post with slug "${slug}" already exists` },
        { status: 409, headers }
      );
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
    return NextResponse.json(
      { success: false, error: 'Failed to import markdown file: ' + message },
      { status: 500, headers }
    );
  }
}
