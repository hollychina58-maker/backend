import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDatabaseAvailable, initializeDatabase } from '../../../../lib/db';
import { getCorsHeaders } from '../../../../lib/cors';
import { requireAuth } from '../../../../lib/auth-middleware';

const LANGUAGES = ['en', 'zh', 'ru', 'ar', 'fa', 'la'];

// Simple frontmatter parser for single-language files
// Format:
// ---
// slug: my-post
// title: Title
// excerpt: Excerpt
// content: |
//   # Markdown content
// ---
function parseSimpleFrontmatter(fileContent: string): {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
} {
  const lines = fileContent.split('\n');
  let inFrontmatter = false;
  const frontmatterLines: string[] = [];

  for (const line of lines) {
    if (line.trim() === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
      } else {
        inFrontmatter = false;
        break;
      }
    } else if (inFrontmatter) {
      frontmatterLines.push(line);
    }
  }

  const data: Record<string, string> = {};
  for (const line of frontmatterLines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      data[key] = value;
    }
  }

  // Extract content after frontmatter - multi-line content block
  let content = '';
  const contentStartIdx = fileContent.indexOf('content: |');
  if (contentStartIdx !== -1) {
    const afterContent = fileContent.slice(contentStartIdx + 'content: |'.length);
    const lines3 = afterContent.split('\n');
    const contentLines: string[] = [];
    let started = false;
    for (const l of lines3) {
      if (l.trim() === '' && !started) continue;
      if (l.trim() === '---') break;
      if (l.match(/^[a-zA-Z0-9#]/)) {
        // Non-space indented line that's not empty - end of content
        if (!started) {
          started = true;
          contentLines.push(l);
        } else {
          break;
        }
      } else {
        started = true;
        // Remove leading spaces (2 spaces for continuation)
        if (l.startsWith('  ')) {
          contentLines.push(l.slice(2));
        } else if (l.trim() !== '') {
          contentLines.push(l);
        }
      }
    }
    content = contentLines.join('\n').trim();
  }

  return {
    slug: data.slug || '',
    title: data.title || '',
    excerpt: data.excerpt || '',
    content: content
  };
}

// Extract language from filename suffix
function extractLanguage(filename: string): string | null {
  const match = filename.match(/_([a-z]{2})\.md$/i);
  return match ? match[1].toLowerCase() : null;
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

    // Extract language from filename
    const lang = extractLanguage(file.name);
    if (!lang || !LANGUAGES.includes(lang)) {
      return NextResponse.json({
        success: false,
        error: `Filename must end with language code (_en, _zh, _ru, _ar, _fa, _la). Got: ${file.name}`
      }, { status: 400, headers });
    }

    const fileContent = await file.text();
    const { slug, title, excerpt, content } = parseSimpleFrontmatter(fileContent);

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required in frontmatter' }, { status: 400, headers });
    }

    // Check if post with same slug exists
    const existing = await sql`SELECT id, content FROM blog_posts WHERE LOWER(slug) = LOWER(${slug})`;
    const now = new Date().toISOString();

    if (existing.length > 0) {
      // Update existing post with this language's content
      const existingPost = existing[0] as { id: string; content: Record<string, any> };
      const existingContent = existingPost.content || {};

      // Update only this language's content, preserve others
      existingContent[lang] = { title, excerpt, content };

      await sql`
        UPDATE blog_posts
        SET content = ${JSON.stringify(existingContent)}::jsonb,
            updated_at = ${now}
        WHERE id = ${existingPost.id}
      `;

      return NextResponse.json({
        success: true,
        data: { id: existingPost.id, slug },
        message: `Updated language "${lang}" for post: ${slug}`
      }, { status: 200, headers });
    }

    // Create new post with this language
    const id = `BP-${Date.now()}`;
    const contentByLang: Record<string, { title: string; excerpt: string; content: string }> = {};
    contentByLang[lang] = { title, excerpt, content };

    await sql`
      INSERT INTO blog_posts (id, slug, cover_image, tags, author, date, read_time, published, content, created_at, updated_at)
      VALUES (
        ${id},
        ${slug || file.name.replace('.md', '').toLowerCase().replace(/[^a-z0-9-]/g, '-')},
        ${''},
        ${'[]'}::jsonb,
        ${'Admin'},
        ${now.split('T')[0]},
        ${'5 min'},
        ${false},
        ${JSON.stringify(contentByLang)}::jsonb,
        ${now},
        ${now}
      )
    `;

    return NextResponse.json({
      success: true,
      data: { id, slug: slug || file.name },
      message: `Imported: ${slug || file.name} (language: ${lang})`
    }, { status: 201, headers });

  } catch (error) {
    console.error('[Blog Import] Error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: 'Failed to import markdown file: ' + message }, { status: 500, headers });
  }
}