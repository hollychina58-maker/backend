import { BlogPost, BlogPostInput } from '../types/blog';
import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'blog.json');

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

export async function getPosts(): Promise<BlogPost[]> {
  return readData();
}

export async function getPost(id: string): Promise<BlogPost | null> {
  const posts = await readData();
  return posts.find((p) => p.id === id) || null;
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await readData();
  return posts.find((p) => p.slug === slug) || null;
}

export async function createPost(input: BlogPostInput): Promise<BlogPost> {
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
  const posts = await readData();
  const index = posts.findIndex((p) => p.id === id);
  if (index === -1) return false;

  posts.splice(index, 1);
  await writeData(posts);
  return true;
}
