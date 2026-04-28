import { z } from 'zod';

const productSpecSchema = z.object({
  name: z.string().min(1),
  value: z.string().min(1),
  unit: z.string().optional(),
});

const productContentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
});

const productInputSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  image: z.string().url().optional(),
  specs: z.record(z.string(), z.array(productSpecSchema)),
  published: z.boolean(),
  content: z.record(z.string(), productContentSchema),
});

const blogContentSchema = z.object({
  title: z.string().min(1).max(300),
  excerpt: z.string().min(1).max(1000),
  content: z.string().min(1),
});

const blogPostInputSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  coverImage: z.string().url().optional(),
  tags: z.array(z.string()).max(20),
  author: z.string().min(1).max(100),
  date: z.string(),
  readTime: z.string().min(1),
  published: z.boolean(),
  content: z.record(z.string(), blogContentSchema),
});

export function validateProductInput(data: unknown) {
  return productInputSchema.safeParse(data);
}

export function validateBlogPostInput(data: unknown) {
  return blogPostInputSchema.safeParse(data);
}

export type ValidatedProductInput = z.infer<typeof productInputSchema>;
export type ValidatedBlogPostInput = z.infer<typeof blogPostInputSchema>;