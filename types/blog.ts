export interface BlogContent {
  title: string;
  excerpt: string;
  content: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  coverImage: string;
  tags: string[];
  author: string;
  date: string;
  readTime: string;
  published: boolean;
  content: Record<string, BlogContent>;
  createdAt: string;
  updatedAt: string;
}

export type BlogPostInput = Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>;
