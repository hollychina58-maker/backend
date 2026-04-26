import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDatabaseAvailable } from '../../../../lib/db';

export async function POST(request: NextRequest) {
  if (!isDatabaseAvailable()) {
    return NextResponse.json({ success: false, error: 'Database not available' }, { status: 503 });
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { event_type, page_url, product_id, country, language, visitor_id, referrer } = body;

    if (event_type === 'page_view') {
      await sql`
        INSERT INTO page_views (visitor_id, page_url, country, language, referrer)
        VALUES (${visitor_id || 'unknown'}, ${page_url || '/'}, ${country || null}, ${language || null}, ${referrer || null})
      `;
    } else if (event_type === 'product_click' && product_id) {
      await sql`
        INSERT INTO product_clicks (visitor_id, product_id, country, language)
        VALUES (${visitor_id || 'unknown'}, ${product_id}, ${country || null}, ${language || null})
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics track error:', error);
    return NextResponse.json({ success: false, error: 'Failed to track event' }, { status: 500 });
  }
}