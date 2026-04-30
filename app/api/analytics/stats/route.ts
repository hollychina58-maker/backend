import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDatabaseAvailable, initializeDatabase } from '../../../../lib/db';
import { getCorsHeaders } from '../../../../lib/cors';

// OPTIONS handler for CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = getCorsHeaders(origin);
  return new NextResponse(null, { status: 204, headers });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Ensure database is initialized (creates tables if needed)
    await initializeDatabase();
  } catch (error) {
    console.error('[Analytics Stats] Database initialization failed:', error);
    return NextResponse.json({ success: false, error: 'Database initialization failed: ' + (error instanceof Error ? error.message : String(error)) }, { status: 500, headers: corsHeaders });
  }

  if (!isDatabaseAvailable()) {
    console.error('[Analytics Stats] Database not available');
    return NextResponse.json({ success: false, error: 'Database not available' }, { status: 503, headers: corsHeaders });
  }

  const sql = getDb();
  if (!sql) {
    console.error('[Analytics Stats] Failed to get database connection');
    return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500, headers: corsHeaders });
  }

  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total page views
    const viewsResult = await sql`
      SELECT COUNT(*) as count FROM page_views
      WHERE created_at >= ${startDate.toISOString()}
    ` as [{ count: string }];

    // Unique visitors
    const visitorsResult = await sql`
      SELECT COUNT(DISTINCT visitor_id) as count FROM page_views
      WHERE created_at >= ${startDate.toISOString()}
    ` as [{ count: string }];

    // Page views by day
    const viewsByDay = await sql`
      SELECT DATE(created_at) as date, COUNT(*) as views
      FROM page_views
      WHERE created_at >= ${startDate.toISOString()}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    ` as { date: Date; views: number }[];

    // Top products clicked
    const topProducts = await sql`
      SELECT product_id, COUNT(*) as clicks
      FROM product_clicks
      WHERE created_at >= ${startDate.toISOString()}
      GROUP BY product_id
      ORDER BY clicks DESC
      LIMIT 10
    ` as { product_id: string; clicks: number }[];

    // Top countries
    const topCountries = await sql`
      SELECT country, COUNT(*) as views
      FROM page_views
      WHERE created_at >= ${startDate.toISOString()} AND country IS NOT NULL
      GROUP BY country
      ORDER BY views DESC
      LIMIT 10
    ` as { country: string; views: number }[];

    // Top pages
    const topPages = await sql`
      SELECT page_url, COUNT(*) as views
      FROM page_views
      WHERE created_at >= ${startDate.toISOString()}
      GROUP BY page_url
      ORDER BY views DESC
      LIMIT 10
    ` as { page_url: string; views: number }[];

    // Safely serialize dates - handle both Date objects and string dates from Neon
    const serializedViewsByDay = viewsByDay.map((v: { date: Date | string; views: number }) => {
      const dateValue = v.date;
      let dateStr: string;
      if (dateValue instanceof Date) {
        dateStr = dateValue.toISOString().split('T')[0];
      } else {
        dateStr = String(dateValue).split('T')[0];
      }
      return { date: dateStr, views: Number(v.views) };
    });

    return NextResponse.json({
      success: true,
      data: {
        totalViews: parseInt(viewsResult[0]?.count ?? '0', 10),
        uniqueVisitors: parseInt(visitorsResult[0]?.count ?? '0', 10),
        viewsByDay: serializedViewsByDay,
        topProducts: topProducts.map(p => ({
          product_id: p.product_id,
          clicks: Number(p.clicks)
        })),
        topCountries: topCountries.map(c => ({
          country: c.country,
          views: Number(c.views)
        })),
        topPages: topPages.map(p => ({
          page_url: p.page_url,
          views: Number(p.views)
        })),
      },
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('[Analytics Stats] Failed to fetch stats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch stats: ' + (error instanceof Error ? error.message : String(error)) }, { status: 500, headers: corsHeaders });
  }
}