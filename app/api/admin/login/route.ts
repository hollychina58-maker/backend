import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '../../../../lib/auth';

// Simple in-memory rate limiter for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minute

function getClientIp(request: NextRequest): string {
  // Priority order for IP detection (most reliable first)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare

  // Use CF-IP if behind Cloudflare CDN (most trusted CDN header)
  if (cfConnectingIp) {
    return cfConnectingIp.split(',')[0].trim();
  }

  // If x-forwarded-for has many IPs, it's likely spoofed - use x-real-ip instead
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim()).filter(ip => ip);
    if (ips.length === 1) {
      // Single IP in forwarded-for, likely legitimate
      return ips[0];
    }
    // Multiple IPs - could be spoofed, check x-real-ip as fallback
    if (realIp) {
      return realIp.split(',')[0].trim();
    }
    // Fall back to first IP but this is less reliable
    return ips[0];
  }

  // Fall back to x-real-ip
  if (realIp) {
    return realIp.split(',')[0].trim();
  }

  // Last resort - use a placeholder (would need middleware-level solution)
  return 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record) {
    return false;
  }

  if (now - record.lastAttempt > WINDOW_MS) {
    loginAttempts.delete(ip);
    return false;
  }

  return record.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now - record.lastAttempt > WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
  } else {
    record.count++;
    record.lastAttempt = now;
  }
}

function clearFailedAttempts(ip: string): void {
  loginAttempts.delete(ip);
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);

  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { success: false, error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    if (await verifyPassword(password)) {
      clearFailedAttempts(clientIp);
      return NextResponse.json({
        success: true,
        user: { name: 'Admin', email: 'admin@mmes-mcti.com' },
      });
    }

    recordFailedAttempt(clientIp);

    return NextResponse.json(
      { success: false, error: 'Invalid password' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
