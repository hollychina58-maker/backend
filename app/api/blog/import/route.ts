import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDatabaseAvailable, initializeDatabase } from '../../../../lib/db';
import { getCorsHeaders } from '../../../../lib/cors';
import { requireAuth } from '../../../../lib/auth-middleware';

// Simple markdown frontmatter parser (no external dependencies)
function parseFrontmatter(content: string): { data: Record<string, string>; body: string } {
  const lines = content.split('\n');
  const data: Record<string, string> = {};
  let body = content;
  let inFrontmatter = false;
  let frontmatterLines: string[] = [];

  for (const line of lines) {
    if (line.trim() === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
        frontmatterLines = [];
      } else {
        // End of frontmatter
        inFrontmatter = false;
      }
    } else if (inFrontmatter) {
      frontmatterLines.push(line);
    } else {
      break;
    }
  }

  if (frontmatterLines.length > 0) {
    body = lines.slice(frontmatterLines.length + 2).join('\n').trim();
    for (const line of frontmatterLines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        const value = line.slice(colonIndex + 1).trim();
        data[key] = value;
      }
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

    const content = await file.text();
    const { data, body } = parseFrontmatter(content);

    // Extract fields from frontmatter
    const slug = data.slug || file.name.replace('.md', '').toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const title = data.title || slug;
    const author = data.author || 'Admin';
    const date = data.date || new Date().toISOString().split('T')[0];
    const tagsStr = data.tags || '';
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
    const coverImage = data.cover_image || data.coverImage || '';
    const published = data.published === 'true' || data.published === '1';
    const readTime = data.read_time || data.readTime || Math.max(1, Math.ceil(body.split(/\s+/).length / 200)) + ' min';

    // Create multi-language content structure
    const languages = ['en', 'zh', 'ru', 'ar', 'fa', 'la'];
    const contentByLang: Record<string, { title: string; excerpt: string; content: string }> = {};

    for (const lang of languages) {
      contentByLang[lang] = {
        title: lang === 'en' ? title : `[${lang}] ${title}`,
        excerpt: lang === 'en' ? body.slice(0, 200) + '...' : '',
        content: body,
      };
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

    return NextResponse.json({
      success: true,
      data: { id, slug },
      message: `Imported: ${slug}`
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
