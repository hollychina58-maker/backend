import { NextResponse } from 'next/server';
import { getDb, isDatabaseAvailable } from '../../../lib/db';
import { Product } from '../../../types/product';

const DATA_PATH = 'data/products.json';

async function readProductsFromJson(): Promise<Product[]> {
  const fs = await import('fs/promises');
  const path = await import('path');
  try {
    const content = await fs.readFile(path.join(process.cwd(), DATA_PATH), 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export async function POST() {
  if (!isDatabaseAvailable()) {
    return NextResponse.json(
      { success: false, error: 'Database not configured' },
      { status: 503 }
    );
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json(
      { success: false, error: 'Database connection failed' },
      { status: 500 }
    );
  }

  try {
    const products = await readProductsFromJson();

    if (products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No products found in JSON file' },
        { status: 404 }
      );
    }

    let imported = 0;
    let skipped = 0;

    for (const product of products) {
      const existing = await sql`SELECT id FROM products WHERE id = ${product.id}`;

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      const now = new Date().toISOString();
      await sql`
        INSERT INTO products (id, slug, image, specs, published, content, created_at, updated_at)
        VALUES (
          ${product.id},
          ${product.slug},
          ${product.image || ''},
          ${JSON.stringify(product.specs)}::jsonb,
          ${product.published ?? false},
          ${JSON.stringify(product.content)}::jsonb,
          ${product.createdAt || now},
          ${product.updatedAt || now}
        )
      `;
      imported++;
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${imported} products, skipped ${skipped} existing`,
      imported,
      skipped,
    });
  } catch (error) {
    console.error('Failed to import products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import products' },
      { status: 500 }
    );
  }
}