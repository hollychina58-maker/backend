import { BlogPost, BlogPostInput } from '../types/blog';
import { getDb, isDatabaseAvailable } from './db';
import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'blog.json');

interface DbBlogRow {
  id: string;
  slug: string;
  cover_image: string | null;
  tags: string[];
  author: string | null;
  date: string | null;
  read_time: string | null;
  published: boolean;
  content: Record<string, { title: string; excerpt: string; content: string }>;
  created_at: string;
  updated_at: string;
}

// JSON file operations (fallback when no database)
async function readData(): Promise<BlogPost[]> {
  try {
    const content = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function writeData(posts: BlogPost[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(posts, null, 2), 'utf-8');
}

// Database operations
async function getPostsFromDb(): Promise<BlogPost[]> {
  const sql = getDb();
  if (!sql) return [];

  try {
    const rows = await sql`
      SELECT id, slug, cover_image, tags, author, date, read_time, published, content, created_at, updated_at
      FROM blog_posts
      ORDER BY created_at DESC
    ` as unknown as DbBlogRow[];

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      coverImage: row.cover_image || '',
      tags: row.tags || [],
      author: row.author || '',
      date: row.date || '',
      readTime: row.read_time || '',
      published: row.published,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    console.error('Failed to fetch posts from database:', error);
    return [];
  }
}

async function getPostFromDb(id: string): Promise<BlogPost | null> {
  const sql = getDb();
  if (!sql) return null;

  try {
    const rows = await sql`
      SELECT id, slug, cover_image, tags, author, date, read_time, published, content, created_at, updated_at
      FROM blog_posts
      WHERE id = ${id}
    ` as unknown as DbBlogRow[];

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      slug: row.slug,
      coverImage: row.cover_image || '',
      tags: row.tags || [],
      author: row.author || '',
      date: row.date || '',
      readTime: row.read_time || '',
      published: row.published,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    console.error('Failed to fetch post from database:', error);
    return null;
  }
}

async function getPostBySlugFromDb(slug: string): Promise<BlogPost | null> {
  const sql = getDb();
  if (!sql) return null;

  try {
    const rows = await sql`SELECT * FROM blog_posts WHERE LOWER(slug) = LOWER(${slug})` as unknown as DbBlogRow[];

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      slug: row.slug,
      coverImage: row.cover_image || '',
      tags: row.tags || [],
      author: row.author || '',
      date: row.date || '',
      readTime: row.read_time || '',
      published: row.published,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    console.error('Failed to fetch post by slug from database:', error);
    return null;
  }
}

async function createPostInDb(input: BlogPostInput): Promise<BlogPost> {
  const sql = getDb();
  if (!sql) throw new Error('Database not available');

  const now = new Date().toISOString();
  const id = `BP-${Date.now()}`;

  await sql`
    INSERT INTO blog_posts (id, slug, cover_image, tags, author, date, read_time, published, content, created_at, updated_at)
    VALUES (
      ${id},
      ${input.slug},
      ${input.coverImage || ''},
      ${JSON.stringify(input.tags)}::jsonb,
      ${input.author || ''},
      ${input.date || ''},
      ${input.readTime || ''},
      ${input.published},
      ${JSON.stringify(input.content)}::jsonb,
      ${now},
      ${now}
    )
  `;

  return {
    ...input,
    id,
    createdAt: now,
    updatedAt: now,
  };
}

async function updatePostInDb(id: string, input: Partial<BlogPostInput>): Promise<BlogPost | null> {
  const sql = getDb();
  if (!sql) return null;

  try {
    const now = new Date().toISOString();

    const result = await sql`
      UPDATE blog_posts SET
        slug = COALESCE(${input.slug ?? null}, slug),
        cover_image = COALESCE(${input.coverImage ?? null}, cover_image),
        tags = COALESCE(${input.tags ? JSON.stringify(input.tags) : null}::jsonb, tags),
        author = COALESCE(${input.author ?? null}, author),
        date = COALESCE(${input.date ?? null}, date),
        read_time = COALESCE(${input.readTime ?? null}, read_time),
        published = COALESCE(${input.published ?? null}, published),
        content = COALESCE(${input.content ? JSON.stringify(input.content) : null}::jsonb, content),
        updated_at = ${now}
      WHERE id = ${id}
      RETURNING *
    ` as unknown as DbBlogRow[];

    if (result.length === 0) return null;

    const row = result[0];
    return {
      id: row.id,
      slug: row.slug,
      coverImage: row.cover_image || '',
      tags: row.tags || [],
      author: row.author || '',
      date: row.date || '',
      readTime: row.read_time || '',
      published: row.published,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    console.error('Failed to update post in database:', error);
    return null;
  }
}

async function deletePostInDb(id: string): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    const result = await sql`DELETE FROM blog_posts WHERE id = ${id} RETURNING id`;
    return result.length > 0;
  } catch (error) {
    console.error('Failed to delete post from database:', error);
    return false;
  }
}

// Public API - uses database if available, falls back to JSON file
export async function getPosts(): Promise<BlogPost[]> {
  if (isDatabaseAvailable()) {
    try {
      const posts = await getPostsFromDb();
      if (posts.length > 0) return posts;
    } catch (error) {
      console.error('Database query failed, falling back to JSON:', error);
    }
  }
  return readData();
}

export async function getPost(id: string): Promise<BlogPost | null> {
  if (isDatabaseAvailable()) {
    const post = await getPostFromDb(id);
    if (post) return post;
  }
  const posts = await readData();
  return posts.find((p) => p.id === id) || null;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (isDatabaseAvailable()) {
    const post = await getPostBySlugFromDb(slug);
    if (post) return post;
  }
  const posts = await readData();
  return posts.find((p) => p.slug.toLowerCase() === slug.toLowerCase()) || null;
}

export async function createPost(input: BlogPostInput): Promise<BlogPost> {
  if (isDatabaseAvailable()) {
    try {
      return await createPostInDb(input);
    } catch (error) {
      console.error('Failed to create post in database, falling back to JSON:', error);
    }
  }

  // Fallback to JSON file
  const posts = await readData();
  const now = new Date().toISOString();
  const post: BlogPost = {
    ...input,
    id: `BP-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  posts.push(post);
  await writeData(posts);
  return post;
}

export async function updatePost(
  id: string,
  input: Partial<BlogPostInput>
): Promise<BlogPost | null> {
  if (isDatabaseAvailable()) {
    try {
      return await updatePostInDb(id, input);
    } catch (error) {
      console.error('Failed to update post in database, falling back to JSON:', error);
    }
  }

  // Fallback to JSON file
  const posts = await readData();
  const index = posts.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const updated: BlogPost = {
    ...posts[index],
    ...input,
    updatedAt: new Date().toISOString(),
  };
  posts[index] = updated;
  await writeData(posts);
  return updated;
}

export async function deletePost(id: string): Promise<boolean> {
  if (isDatabaseAvailable()) {
    try {
      return await deletePostInDb(id);
    } catch (error) {
      console.error('Failed to delete post from database, falling back to JSON:', error);
    }
  }

  // Fallback to JSON file
  const posts = await readData();
  const index = posts.findIndex((p) => p.id === id);
  if (index === -1) return false;

  posts.splice(index, 1);
  await writeData(posts);
  return true;
}
