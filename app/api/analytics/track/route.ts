import { NextRequest, NextResponse } from 'next/server';
import { getDb, isDatabaseAvailable, initializeDatabase } from '../../../../lib/db';

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

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  if (isRateLimited(clientIp)) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
  }

  // Ensure database is initialized (creates tables if needed)
  await initializeDatabase();

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
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to track event' }, { status: 500 });
  }
}