import { NextResponse } from 'next/server';
import { initializeDatabase, isDatabaseAvailable } from '../../../lib/db';

// Initialize database schema
export async function POST() {
  try {
    if (!isDatabaseAvailable()) {
      return NextResponse.json(
        { success: false, error: 'Database not configured (DATABASE_URL not set)' },
        { status: 503 }
      );
    }

    await initializeDatabase();
    return NextResponse.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize database' },
      { status: 500 }
    );
  }
}

// Check database status
export async function GET() {
  const available = isDatabaseAvailable();
  return NextResponse.json({
    success: true,
    databaseAvailable: available,
    message: available ? 'Database is configured' : 'Database is not configured (DATABASE_URL not set)',
  });
}
