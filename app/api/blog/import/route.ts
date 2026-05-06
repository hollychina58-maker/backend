import { NextRequest, NextResponse } from 'next/server';
import matter from 'gray-matter';
import { createPost, getPosts } from '../../../lib/blog-data';
import { BlogPostInput } from '../../../types/blog';
import { getCorsHeaders } from '../../../lib/cors';
import { requireAuth } from '../../../lib/auth-middleware';
import { initializeDatabase } from '../../../lib/db';

export async function POST(request: NextRequest) {
  const headers = getCorsHeaders(request.headers.get('origin'));
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    await initializeDatabase();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400, headers });
    }

    if (!file.name.endsWith('.md')) {
      return NextResponse.json({ success: false, error: 'Only .md files are supported' }, { status: 400, headers });
    }

    const content = await file.text();
    const { data: frontmatter, content: markdownContent } = matter(content);

    // Extract title from first # heading if no title in frontmatter
    const titleFromContent = markdownContent.match(/^#\s+(.+)$/m)?.[1] || '';
    const title = frontmatter.title || titleFromContent || file.name.replace('.md', '');

    // Generate slug from title or filename
    const slugBase = frontmatter.slug || title.toLowerCase().replace(/[^a-z0-9一-龥]+/g, '-').replace(/^-|-$/g, '');
    const slug = slugBase || file.name.replace('.md', '').toLowerCase().replace(/[^a-z0-9-]/g, '-');

    // Parse tags
    let tags: string[] = [];
    if (frontmatter.tags) {
      if (typeof frontmatter.tags === 'string') {
        tags = frontmatter.tags.split(',').map(t => t.trim()).filter(Boolean);
      } else if (Array.isArray(frontmatter.tags)) {
        tags = frontmatter.tags;
      }
    }

    // Build multi-language content structure
    const languageContent: Record<string, { title: string; excerpt: string; content: string }> = {};

    // Check if frontmatter has language-specific content
    const languages = ['en', 'zh', 'ru', 'ar', 'fa', 'la'];

    for (const lang of languages) {
      const langKey = lang === 'zh' ? '中文' : lang;
      const langTitle = frontmatter[`title_${lang}`] || frontmatter[`title_${langKey}`] || (lang === 'en' ? title : '');
      const langExcerpt = frontmatter[`excerpt_${lang}`] || frontmatter[`excerpt_${langKey}`] || '';
      const langContent = frontmatter[`content_${lang}`] || frontmatter[`content_${langKey}`] || '';

      if (langTitle || langExcerpt || langContent) {
        languageContent[lang] = {
          title: langTitle || title,
          excerpt: langExcerpt || (lang === 'en' ? markdownContent.slice(0, 200) + '...' : ''),
          content: langContent || markdownContent,
        };
      }
    }

    // If no language-specific content, use main content for all
    if (Object.keys(languageContent).length === 0) {
      languageContent['en'] = {
        title: title,
        excerpt: frontmatter.excerpt || markdownContent.slice(0, 200) + '...',
        content: markdownContent,
      };
    }

    // Get existing posts to avoid duplicate slugs
    const existingPosts = await getPosts();
    let finalSlug = slug;
    let counter = 1;
    while (existingPosts.some(p => p.slug === finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const postInput: BlogPostInput = {
      slug: finalSlug,
      coverImage: frontmatter.coverImage || frontmatter.image || '',
      tags: tags,
      author: frontmatter.author || 'Admin',
      date: frontmatter.date || new Date().toISOString().split('T')[0],
      readTime: frontmatter.readTime || '5 min',
      published: frontmatter.published !== undefined ? Boolean(frontmatter.published) : false,
      content: languageContent,
    };

    console.log('[Import API] Creating post with slug:', finalSlug);
    console.log('[Import API] Tags:', tags);
    console.log('[Import API] Languages:', Object.keys(languageContent));

    const post = await createPost(postInput);

    return NextResponse.json({
      success: true,
      data: post,
      message: `Successfully imported "${title}"`,
    }, { status: 201, headers });

  } catch (error) {
    console.error('[Import API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import markdown file' },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const headers = getCorsHeaders(request.headers.get('origin'));
  return new NextResponse(null, { status: 204, headers });
}