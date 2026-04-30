import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDatabaseAvailable, initializeDatabase } from '../../../../../lib/db';
import { getCorsHeaders } from '../../../../../lib/cors';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const headers = getCorsHeaders(origin);
  return new NextResponse(null, { status: 204, headers });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ country: string }> }
) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  const { country } = await params;
  const decodedCountry = decodeURIComponent(country);

  try {
    await initializeDatabase();
  } catch (error) {
    console.error('[Analytics Country] Database initialization failed:', error);
    return NextResponse.json(
      { success: false, error: 'Database initialization failed' },
      { status: 500, headers: corsHeaders }
    );
  }

  if (!isDatabaseAvailable()) {
    return NextResponse.json(
      { success: false, error: 'Database not available' },
      { status: 503, headers: corsHeaders }
    );
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json(
      { success: false, error: 'Database connection failed' },
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    if (!decodedCountry || decodedCountry === 'undefined') {
      return NextResponse.json(
        { success: false, error: 'Country parameter is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get unique visitors for this country
    const uniqueResult = await sql`
      SELECT COUNT(DISTINCT visitor_id) as unique_visitors
      FROM page_views
      WHERE country = ${decodedCountry}
        AND created_at >= NOW() - INTERVAL '30 days'
    ` as [{ unique_visitors: string }];
    const uniqueVisitors = Number(uniqueResult[0]?.unique_visitors || 0);

    // Get total views for this country
    const viewsResult = await sql`
      SELECT COUNT(*) as total_views
      FROM page_views
      WHERE country = ${decodedCountry}
        AND created_at >= NOW() - INTERVAL '30 days'
    ` as [{ total_views: string }];
    const totalViews = Number(viewsResult[0]?.total_views || 0);

    // Get top pages
    const topPagesResult = await sql`
      SELECT page_url, COUNT(*) as views
      FROM page_views
      WHERE country = ${decodedCountry}
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY page_url
      ORDER BY views DESC
      LIMIT 10
    ` as { page_url: string; views: string }[];
    const topPages = topPagesResult.map(row => ({
      page_url: row.page_url || '/',
      views: Number(row.views || 0)
    }));

    // Get top products (clicks)
    const topProductsResult = await sql`
      SELECT product_id, COUNT(*) as clicks
      FROM product_clicks
      WHERE country = ${decodedCountry}
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY product_id
      ORDER BY clicks DESC
      LIMIT 10
    ` as { product_id: string; clicks: string }[];
    const topProducts = topProductsResult.map(row => ({
      product_id: row.product_id || 'unknown',
      clicks: Number(row.clicks || 0)
    }));

    // Get views by day
    const viewsByDayResult = await sql`
      SELECT DATE(created_at) as date, COUNT(*) as views
      FROM page_views
      WHERE country = ${decodedCountry}
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    ` as { date: Date; views: string }[];
    const viewsByDay = viewsByDayResult.map(row => ({
      date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date),
      views: Number(row.views || 0)
    }));

    // Get referrers
    const referrersResult = await sql`
      SELECT COALESCE(NULLIF(referrer, ''), 'direct') as referrer, COUNT(*) as visits
      FROM page_views
      WHERE country = ${decodedCountry}
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY referrer
      ORDER BY visits DESC
      LIMIT 10
    ` as { referrer: string; visits: string }[];
    const totalReferrerVisits = referrersResult.reduce((sum, r) => sum + Number(r.visits || 0), 0);
    const referrers = referrersResult.map(row => ({
      referrer: row.referrer || 'direct',
      visits: Number(row.visits || 0),
      percentage: totalReferrerVisits > 0 ? (Number(row.visits || 0) / totalReferrerVisits) * 100 : 0
    }));

    return NextResponse.json({
      success: true,
      data: {
        country: decodedCountry,
        uniqueVisitors,
        totalViews,
        topPages,
        topProducts,
        viewsByDay,
        referrers
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('[Analytics Country API Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch country analytics' },
      { status: 500, headers: corsHeaders }
    );
  }
}
