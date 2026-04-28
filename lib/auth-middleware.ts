import { NextRequest, NextResponse } from 'next/server';

const ADMIN_API_KEY_HASH = process.env.ADMIN_API_KEY_HASH;

export function verifyApiKey(request: NextRequest): NextResponse | null {
  if (!ADMIN_API_KEY_HASH) {
    console.error('ADMIN_API_KEY_HASH environment variable not set');
    return NextResponse.json(
      { success: false, error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid authorization header' },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);

  if (!token || token !== ADMIN_API_KEY_HASH) {
    return NextResponse.json(
      { success: false, error: 'Invalid API key' },
      { status: 401 }
    );
  }

  return null;
}

export function requireAuth(request: NextRequest) {
  return verifyApiKey(request);
}