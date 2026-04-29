import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDatabaseAvailable, initializeDatabase } from '../../../../lib/db';
import { getCorsHeaders } from '../../../../lib/cors';

// Simple in-memory rate limiter for analytics
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // max requests per minute per IP
const WINDOW_MS = 60 * 1000;

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.split(',')[0].trim();
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return false;
  }

  if (record.count >= RATE_LIMIT) {
    return true;
  }

  record.count++;
  return false;
}

// Cleanup old analytics data (30-day retention)
async function cleanupOldData(sql: any): Promise<{ deletedViews: number; deletedClicks: number }> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);
  const cutoffStr = cutoffDate.toISOString();

  // Delete old page views
  const viewsResult = await sql`DELETE FROM page_views WHERE created_at < ${cutoffStr} RETURNING id`;
  const deletedViews = Array.isArray(viewsResult) ? viewsResult.length : 0;

  // Delete old product clicks
  const clicksResult = await sql`DELETE FROM product_clicks WHERE created_at < ${cutoffStr} RETURNING id`;
  const deletedClicks = Array.isArray(clicksResult) ? clicksResult.length : 0;

  return { deletedViews, deletedClicks };
}

export async function POST(request: NextRequest) {
  const headers = getCorsHeaders(request.headers.get('origin'));
  const clientIp = getClientIp(request);

  if (isRateLimited(clientIp)) {
    console.warn('[Analytics Track] Rate limit exceeded for IP:', clientIp);
    return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Ensure database is initialized (creates tables if needed)
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('[Analytics Track] Database initialization failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Database initialization failed: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }

  if (!isDatabaseAvailable()) {
    console.error('[Analytics Track] Database not available - DATABASE_URL may be missing');
    return NextResponse.json({ success: false, error: 'Database not available' }, { status: 503 });
  }

  const sql = getDb();
  if (!sql) {
    console.error('[Analytics Track] Failed to get database connection');
    return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
  }

  // Perform 30-day cleanup (random chance to avoid doing it on every request)
  // ~5% chance per request = approximately once every 20 requests on average
  if (Math.random() < 0.05) {
    try {
      const cleanup = await cleanupOldData(sql);
      if (cleanup.deletedViews > 0 || cleanup.deletedClicks > 0) {
        console.log(`[Analytics Track] Cleanup: deleted ${cleanup.deletedViews} page_views, ${cleanup.deletedClicks} product_clicks`);
      }
    } catch (cleanupError) {
      console.error('[Analytics Track] Cleanup failed:', cleanupError);
      // Don't fail the tracking request if cleanup fails
    }
  }

  try {
    const body = await request.json();
    const { event_type, page_url, product_id, country, language, visitor_id, referrer } = body;

    // Validate visitor_id format (alphanumeric, max 64 chars)
    const safeVisitorId = (visitor_id || 'unknown').toString().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);

    if (event_type === 'page_view') {
      await sql`
        INSERT INTO page_views (visitor_id, page_url, country, language, referrer)
        VALUES (${safeVisitorId}, ${(page_url || '/').slice(0, 500)}, ${(country || null)?.slice(0, 10)}, ${(language || null)?.slice(0, 10)}, ${(referrer || null)?.slice(0, 500)})
      `;
    } else if (event_type === 'product_click' && product_id) {
      await sql`
        INSERT INTO product_clicks (visitor_id, product_id, country, language)
        VALUES (${safeVisitorId}, ${product_id.toString().slice(0, 50)}, ${(country || null)?.slice(0, 10)}, ${(language || null)?.slice(0, 10)})
      `;
    } else {
      console.warn('[Analytics Track] Unknown event type:', event_type);
      return NextResponse.json({ success: false, error: 'Unknown event type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics Track] Failed to track event:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to track event: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}