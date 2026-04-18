import { Product, ProductInput, ProductSpec } from '../types/product';
import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'products.json');

const ALL_LANG_CODES = ['en', 'zh', 'ru', 'ar', 'fa', 'la'];

interface OldFormatProduct {
  id: string;
  slug: string;
  image: string;
  specs: ProductSpec[];  // Old format: simple array
  published: boolean;
  content: Record<string, { name: string; description: string }>;
  createdAt: string;
  updatedAt: string;
}

function migrateProduct(product: Product | OldFormatProduct): Product {
  // Check if specs is an array (old format) or object (new format)
  const isOldFormat = Array.isArray(product.specs);

  if (isOldFormat) {
    // Migrate old format to new per-language format
    const oldSpecs = product.specs as ProductSpec[];
    const migratedSpecs: Record<string, ProductSpec[]> = { en: oldSpecs };

    // Initialize other languages with empty arrays
    ALL_LANG_CODES.filter(l => l !== 'en').forEach(lang => {
      migratedSpecs[lang] = [];
    });

    return {
      ...product,
      specs: migratedSpecs,
    } as Product;
  }

  return product as Product;
}

async function readData(): Promise<Product[]> {
  try {
    const content = await fs.readFile(DATA_PATH, 'utf-8');
    const products = JSON.parse(content);
    // Migrate all products to new format
    return products.map(migrateProduct);
  } catch {
    return [];
  }
}

async function writeData(products: Product[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(products, null, 2), 'utf-8');
}

export async function getProducts(): Promise<Product[]> {
  return readData();
}

export async function getProduct(id: string): Promise<Product | null> {
  const products = await readData();
  return products.find((p) => p.id === id) || null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await readData();
  return products.find((p) => p.slug === slug) || null;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const products = await readData();
  const now = new Date().toISOString();
  const product: Product = {
    ...input,
    id: `PA-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  products.push(product);
  await writeData(products);
  return product;
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>
): Promise<Product | null> {
  const products = await readData();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const updated: Product = {
    ...products[index],
    ...input,
    updatedAt: new Date().toISOString(),
  };
  products[index] = updated;
  await writeData(products);
  return updated;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const products = await readData();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return false;

  products.splice(index, 1);
  await writeData(products);
  return true;
}
