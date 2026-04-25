import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDatabaseAvailable } from '../../../lib/db';
import * as XLSX from 'xlsx';

interface Spec {
  name: string;
  value: string;
  unit?: string;
}

interface ProductContent {
  name: string;
  description: string;
}

export async function POST(request: NextRequest) {
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
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse Excel
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const productsSheet = workbook.Sheets['Products'];
    const specsSheet = workbook.Sheets['Specs'];

    if (!productsSheet) {
      return NextResponse.json(
        { success: false, error: 'Missing Products sheet' },
        { status: 400 }
      );
    }

    // Convert to JSON with raw values
    const productsData = XLSX.utils.sheet_to_json<string[]>(productsSheet, { header: 1, defval: '' });
    const specsData = specsSheet
      ? XLSX.utils.sheet_to_json<string[]>(specsSheet, { header: 1, defval: '' })
      : [];

    // Parse header row to get column indices
    const headerRow = productsData[0];
    const headerMap: Record<string, number> = {};
    headerRow.forEach((col, idx) => {
      if (typeof col === 'string') {
        headerMap[col.trim()] = idx;
      }
    });

    // Parse specs header
    let specsHeaderMap: Record<string, number> = {};
    if (specsData.length > 0) {
      const specsHeaderRow = specsData[0];
      specsHeaderRow.forEach((col, idx) => {
        if (typeof col === 'string') {
          specsHeaderMap[col.trim()] = idx;
        }
      });
    }

    // Track results
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Helper to get cell value
    const getCell = (row: string[], col: string): string => {
      const idx = headerMap[col];
      if (idx === undefined) return '';
      const val = row[idx];
      return typeof val === 'string' ? val.trim() : String(val || '').trim();
    };

    const getSpecCell = (row: string[], col: string): string => {
      const idx = specsHeaderMap[col];
      if (idx === undefined) return '';
      const val = row[idx];
      return typeof val === 'string' ? val.trim() : String(val || '').trim();
    };

    // Process products (skip header row)
    for (let i = 1; i < productsData.length; i++) {
      const row = productsData[i];
      if (!row || !Array.isArray(row)) continue;

      const slug = getCell(row, 'slug');
      const published = getCell(row, 'published').toLowerCase() === 'yes';

      // Validate required fields
      if (!slug) {
        skipped++;
        continue;
      }

      // Build content for all languages
      const content: Record<string, ProductContent> = {};
      const langs = ['en', 'zh', 'ru', 'ar', 'fa', 'la'];
      for (const lang of langs) {
        content[lang] = {
          name: getCell(row, `name_${lang}`) || getCell(row, 'name_en') || getCell(row, 'name_zh'),
          description: getCell(row, `desc_${lang}`) || getCell(row, 'desc_en') || getCell(row, 'desc_zh'),
        };
      }

      // Build specs for English (copy to other languages)
      const specs: Record<string, Spec[]> = { en: [], zh: [], ru: [], ar: [], fa: [], la: [] };
      if (specsData.length > 1) {
        for (let j = 1; j < specsData.length; j++) {
          const specRow = specsData[j];
          if (!specRow || !Array.isArray(specRow)) continue;

          const specSlug = getSpecCell(specRow, 'slug');
          if (specSlug !== slug) continue;

          const enSpec: Spec = {
            name: getSpecCell(specRow, 'spec_name'),
            value: getSpecCell(specRow, 'spec_value'),
            unit: getSpecCell(specRow, 'spec_unit') || undefined,
          };
          if (enSpec.name && enSpec.value) {
            specs['en'].push(enSpec);
          }
        }
        // Copy English specs to other languages
        for (const lang of langs) {
          if (lang !== 'en') {
            specs[lang] = specs['en'].map(s => ({ ...s }));
          }
        }
      }

      const now = new Date().toISOString();

      // Upsert product
      try {
        const existing = await sql`SELECT id FROM products WHERE id = ${slug}`;
        if (existing.length > 0) {
          await sql`
            UPDATE products SET
              slug = ${slug},
              image = ${getCell(row, 'image') || ''},
              specs = ${JSON.stringify(specs)}::jsonb,
              published = ${published},
              content = ${JSON.stringify(content)}::jsonb,
              updated_at = ${now}
            WHERE id = ${slug}
          `;
        } else {
          await sql`
            INSERT INTO products (id, slug, image, specs, published, content, created_at, updated_at)
            VALUES (
              ${slug},
              ${slug},
              ${getCell(row, 'image') || ''},
              ${JSON.stringify(specs)}::jsonb,
              ${published},
              ${JSON.stringify(content)}::jsonb,
              ${now},
              ${now}
            )
          `;
        }
        imported++;
      } catch (err) {
        skipped++;
        errors.push(`Failed to import ${slug}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${imported} products, skipped ${skipped} items`,
      imported,
      skipped,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    console.error('Failed to import products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import products' },
      { status: 500 }
    );
  }
}