import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDatabaseAvailable, initializeDatabase } from '../../../../lib/db';
import { getCorsHeaders } from '../../../../lib/cors';
import { requireAuth } from '../../../../lib/auth-middleware';
import { translateText } from '../../../../lib/translate';

const LANGUAGES = ['en', 'zh', 'ru', 'ar', 'fa', 'la'];
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  zh: 'Chinese',
  ru: 'Russian',
  ar: 'Arabic',
  fa: 'Persian',
  la: 'Latin',
};

// Parse frontmatter with multi-language support
// Supports formats:
// 1. title: Single value (will be used as source for translation)
// 2. title.zh, title.en: Language-prefixed values
// 3. title: "zh:xxx|en:xxx" (pipe-separated translations)
function parseFrontmatter(content: string): {
  data: Record<string, string>;
  body: string;
  sourceLang: string;
} {
  const lines = content.split('\n');
  const data: Record<string, string> = {};
  let body = content;
  let inFrontmatter = false;
  let frontmatterLines: string[] = [];
  let sourceLang = 'en';

  for (const line of lines) {
    if (line.trim() === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
        frontmatterLines = [];
      } else {
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

        // Check for language prefix (e.g., "title.zh")
        const dotIndex = key.lastIndexOf('.');
        if (dotIndex > 0) {
          const prefix = key.slice(0, dotIndex);
          const lang = key.slice(dotIndex + 1);
          if (LANGUAGES.includes(lang)) {
            data[key] = value; // e.g., "title.zh"
            if (!sourceLang || sourceLang === 'en') {
              sourceLang = lang;
            }
          }
        } else {
          // Check if value contains pipe-separated translations: "zh:xxx|en:yyy"
          if (value.includes('|') && value.includes(':')) {
            data[key] = value;
          } else {
            data[key] = value;
          }
        }
      }
    }
  }

  return { data, body, sourceLang };
}

// Parse a language-prefixed content block
function parseLangContent(data: Record<string, string>): Record<string, { title: string; excerpt: string; content: string }> {
  const result: Record<string, { title: string; excerpt: string; content: string }> = {};

  // Check for language-prefixed keys
  for (const lang of LANGUAGES) {
    const title = data[`title.${lang}`] || data[`title_${lang}`] || '';
    const excerpt = data[`excerpt.${lang}`] || data[`excerpt_${lang}`] || '';
    const content = data[`content.${lang}`] || data[`content_${lang}`] || '';

    if (title || excerpt || content) {
      result[lang] = { title, excerpt, content };
    }
  }

  // Check for pipe-separated translations: "title: zh:xxx|en:yyy"
  if (Object.keys(result).length === 0) {
    for (const key of ['title', 'excerpt', 'content']) {
      const value = data[key] || '';
      if (value.includes('|') && value.includes(':')) {
        const parts = value.split('|');
        for (const part of parts) {
          const colonIdx = part.indexOf(':');
          const langKey = part.slice(0, colonIdx).trim();
          const text = part.slice(colonIdx + 1).trim();
          if (LANGUAGES.includes(langKey)) {
            if (!result[langKey]) result[langKey] = { title: '', excerpt: '', content: '' };
            if (key === 'title') result[langKey].title = text;
            if (key === 'excerpt') result[langKey].excerpt = text;
            if (key === 'content') result[langKey].content = text;
          }
        }
      }
    }
  }

  return result;
}

// Auto-translate content to target languages
async function autoTranslateContent(
  sourceLang: string,
  content: { title: string; excerpt: string; content: string }
): Promise<Record<string, { title: string; excerpt: string; content: string }>> {
  const result: Record<string, { title: string; excerpt: string; content: string }> = {};
  result[sourceLang] = content;

  const targetLangs = LANGUAGES.filter(l => l !== sourceLang);

  for (const lang of targetLangs) {
    console.log(`[Blog Import] Translating to ${lang}...`);

    const targetContent: { title: string; excerpt: string; content: string } = {
      title: '',
      excerpt: '',
      content: '',
    };

    if (content.title) {
      const r = await translateText(content.title, sourceLang, lang);
      targetContent.title = r.success ? r.translatedText : content.title;
    }

    if (content.excerpt) {
      const r = await translateText(content.excerpt, sourceLang, lang);
      targetContent.excerpt = r.success ? r.translatedText : content.excerpt;
    }

    if (content.content) {
      const r = await translateText(content.content, sourceLang, lang);
      targetContent.content = r.success ? r.translatedText : content.content;
    }

    result[lang] = targetContent;
  }

  return result;
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
    const { data, body, sourceLang } = parseFrontmatter(content);

    // Parse multi-language content from frontmatter
    const langContent = parseLangContent(data);

    // Extract common fields
    const slug = data.slug || file.name.replace('.md', '').toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const author = data.author || 'Admin';
    const date = data.date || new Date().toISOString().split('T')[0];
    const tagsStr = data.tags || '';
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
    const coverImage = data.cover_image || data.coverImage || '';
    const published = data.published === 'true' || data.published === '1';
    const readTime = data.read_time || data.readTime || Math.max(1, Math.ceil(body.split(/\s+/).length / 200)) + ' min';

    let contentByLang: Record<string, { title: string; excerpt: string; content: string }>;

    // If we have multi-language content from frontmatter, use it directly
    if (Object.keys(langContent).length > 0) {
      console.log('[Blog Import] Found multi-language content in frontmatter:', Object.keys(langContent));

      // Fill in missing languages with translations
      for (const lang of LANGUAGES) {
        if (!langContent[lang]) {
          // Try to translate from available content
          const source = langContent[sourceLang] || langContent['en'] || langContent['zh'];
          if (source) {
            console.log(`[Blog Import] Translating missing ${lang} from ${sourceLang}`);
            const translated = await translateText(source.content || source.title, sourceLang, lang);
            if (translated.success) {
              langContent[lang] = {
                title: source.title,
                excerpt: source.excerpt,
                content: translated.translatedText,
              };
            }
          }
        }
      }
      contentByLang = langContent;
    } else {
      // No multi-language content - translate from single language
      console.log('[Blog Import] No multi-language content, will translate...');

      const mainTitle = data.title || slug;
      const mainContent = body;

      contentByLang = await autoTranslateContent(sourceLang, {
        title: mainTitle,
        excerpt: mainContent.slice(0, 200) + '...',
        content: mainContent,
      });
    }

    // Ensure all languages have content
    for (const lang of LANGUAGES) {
      if (!contentByLang[lang]) {
        contentByLang[lang] = contentByLang[sourceLang] || contentByLang['en'] || contentByLang['zh'] || {
          title: slug,
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

    return NextResponse.json({
      success: true,
      data: { id, slug },
      message: `Imported: ${slug} (${LANGUAGES.length} languages)`
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
