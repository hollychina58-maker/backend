import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDatabaseAvailable } from '../../../../lib/db';

export async function GET(request: NextRequest) {
  if (!isDatabaseAvailable()) {
    return NextResponse.json({ success: false, error: 'Database not available' }, { status: 503 });
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
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

    return NextResponse.json({
      success: true,
      data: {
        totalViews: parseInt(viewsResult[0].count, 10),
        uniqueVisitors: parseInt(visitorsResult[0].count, 10),
        viewsByDay: viewsByDay.map(v => ({ date: v.date.toISOString().split('T')[0], views: v.views })),
        topProducts,
        topCountries,
        topPages,
      },
    });
  } catch (error) {
    console.error('Analytics stats error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
  }
}