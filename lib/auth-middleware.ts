import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb, isDatabaseAvailable, initializeDatabase } from './db';

let dbInitialized = false;

async function ensureDbInitialized(): Promise<void> {
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }
}

export async function verifyApiKey(request: NextRequest): Promise<NextResponse | null> {
  if (!isDatabaseAvailable()) {
    return NextResponse.json(
      { success: false, error: 'Server configuration error - database not available' },
      { status: 500 }
    );
  }

  await ensureDbInitialized();

  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return NextResponse.json(
      { success: false, error: 'Missing authorization header' },
      { status: 401 }
    );
  }

  if (!authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'Invalid authorization format - expected Bearer token' },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Empty API token' },
      { status: 401 }
    );
  }

  try {
    const sql = getDb();
    if (!sql) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const result = await sql`SELECT password_hash FROM admin_users WHERE id = 'admin'`;
    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid API token - admin not configured' },
        { status: 401 }
      );
    }

    const storedHash = result[0].password_hash;
    const isValid = await bcrypt.compare(token, storedHash);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid API token' },
        { status: 401 }
      );
    }

    return null;
  } catch (error) {
    console.error('API key verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed - check server logs' },
      { status: 401 }
    );
  }
}

export function requireAuth(request: NextRequest) {
  return verifyApiKey(request);
}