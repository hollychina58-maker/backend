import { Product, ProductInput, ProductSpec } from '../types/product';
import { getDb, isDatabaseAvailable } from './db';
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

// JSON file operations (fallback when no database)
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

// Database operations
async function getProductsFromDb(): Promise<Product[]> {
  const sql = getDb();
  if (!sql) return [];

  try {
    const rows = await sql`
      SELECT id, slug, image, specs, published, content, created_at, updated_at
      FROM products
      ORDER BY created_at DESC
    ` as unknown as { id: string; slug: string; image: string | null; specs: Record<string, ProductSpec[]>; published: boolean; content: Record<string, { name: string; description: string }>; created_at: string; updated_at: string }[];

    return rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      image: row.image || '',
      specs: row.specs as Record<string, ProductSpec[]>,
      published: row.published,
      content: row.content as Record<string, { name: string; description: string }>,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    console.error('Failed to fetch products from database:', error);
    return [];
  }
}

async function getProductFromDb(id: string): Promise<Product | null> {
  const sql = getDb();
  if (!sql) return null;

  try {
    const rows = await sql`
      SELECT id, slug, image, specs, published, content, created_at, updated_at
      FROM products
      WHERE id = ${id}
    ` as unknown as { id: string; slug: string; image: string | null; specs: Record<string, ProductSpec[]>; published: boolean; content: Record<string, { name: string; description: string }>; created_at: string; updated_at: string }[];

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      slug: row.slug,
      image: row.image || '',
      specs: row.specs as Record<string, ProductSpec[]>,
      published: row.published,
      content: row.content as Record<string, { name: string; description: string }>,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    console.error('Failed to fetch product from database:', error);
    return null;
  }
}

async function createProductInDb(input: ProductInput): Promise<Product> {
  const sql = getDb();
  if (!sql) throw new Error('Database not available');

  const now = new Date().toISOString();
  const id = `PA-${Date.now()}`;

  await sql`
    INSERT INTO products (id, slug, image, specs, published, content, created_at, updated_at)
    VALUES (
      ${id},
      ${input.slug},
      ${input.image || ''},
      ${JSON.stringify(input.specs)}::jsonb,
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

async function updateProductInDb(id: string, input: Partial<ProductInput>): Promise<Product | null> {
  const sql = getDb();
  if (!sql) return null;

  try {
    const now = new Date().toISOString();

    const result = await sql`
      UPDATE products SET
        slug = COALESCE(${input.slug ?? null}, slug),
        image = COALESCE(${input.image ?? null}, image),
        specs = COALESCE(${input.specs ? JSON.stringify(input.specs) : null}::jsonb, specs),
        published = COALESCE(${input.published ?? null}, published),
        content = COALESCE(${input.content ? JSON.stringify(input.content) : null}::jsonb, content),
        updated_at = ${now}
      WHERE id = ${id}
      RETURNING *
    ` as unknown as { id: string; slug: string; image: string | null; specs: Record<string, ProductSpec[]>; published: boolean; content: Record<string, { name: string; description: string }>; created_at: string; updated_at: string }[];

    if (result.length === 0) return null;

    const row = result[0];
    return {
      id: row.id,
      slug: row.slug,
      image: row.image || '',
      specs: row.specs as Record<string, ProductSpec[]>,
      published: row.published,
      content: row.content as Record<string, { name: string; description: string }>,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    console.error('Failed to update product in database:', error);
    return null;
  }
}

async function deleteProductInDb(id: string): Promise<boolean> {
  const sql = getDb();
  if (!sql) return false;

  try {
    const result = await sql`DELETE FROM products WHERE id = ${id} RETURNING id`;
    return result.length > 0;
  } catch (error) {
    console.error('Failed to delete product from database:', error);
    return false;
  }
}

// Public API - uses database if available, falls back to JSON file
export async function getProducts(): Promise<Product[]> {
  if (isDatabaseAvailable()) {
    const products = await getProductsFromDb();
    if (products.length > 0) return products;
  }
  return readData();
}

export async function getProduct(id: string): Promise<Product | null> {
  if (isDatabaseAvailable()) {
    const product = await getProductFromDb(id);
    if (product) return product;
  }
  const products = await readData();
  return products.find((p) => p.id === id) || null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (isDatabaseAvailable()) {
    const sql = getDb();
    if (sql) {
      try {
        const rows = await sql`SELECT * FROM products WHERE LOWER(slug) = LOWER(${slug})`;
        if (rows.length > 0) {
          const row = rows[0] as { id: string; slug: string; image: string | null; specs: Record<string, ProductSpec[]>; published: boolean; content: Record<string, { name: string; description: string }>; created_at: string; updated_at: string };
          return {
            id: row.id,
            slug: row.slug,
            image: row.image || '',
            specs: row.specs as Record<string, ProductSpec[]>,
            published: row.published,
            content: row.content as Record<string, { name: string; description: string }>,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
        }
      } catch (error) {
        console.error('Failed to get product by slug from database:', error);
      }
    }
  }
  const products = await readData();
  return products.find((p) => p.slug.toLowerCase() === slug.toLowerCase()) || null;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  if (isDatabaseAvailable()) {
    try {
      return await createProductInDb(input);
    } catch (error) {
      console.error('Failed to create product in database, falling back to JSON:', error);
    }
  }

  // Fallback to JSON file
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
  if (isDatabaseAvailable()) {
    try {
      return await updateProductInDb(id, input);
    } catch (error) {
      console.error('Failed to update product in database, falling back to JSON:', error);
    }
  }

  // Fallback to JSON file
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
  if (isDatabaseAvailable()) {
    try {
      return await deleteProductInDb(id);
    } catch (error) {
      console.error('Failed to delete product from database, falling back to JSON:', error);
    }
  }

  // Fallback to JSON file
  const products = await readData();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return false;

  products.splice(index, 1);
  await writeData(products);
  return true;
}
