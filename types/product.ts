export interface ProductSpec {
  name: string;
  value: string;
  unit?: string;
}

export interface ProductContent {
  name: string;
  description: string;
}

export interface Product {
  id: string;
  slug: string;
  image: string;
  specs: Record<string, ProductSpec[]>;  // Per-language specs: { en: [...], zh: [...], ... }
  published: boolean;
  content: Record<string, ProductContent>;
  createdAt: string;
  updatedAt: string;
}

export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
