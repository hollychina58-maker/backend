import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '../../../../lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    if (await verifyPassword(password)) {
      return NextResponse.json({
        success: true,
        user: { name: 'Admin', email: 'admin@mmes-mcti.com' },
      });
    }

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
