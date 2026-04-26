import { NextResponse } from 'next/server';
import { getDb, isDatabaseAvailable } from '../../../lib/db';

export async function GET() {
  const available = isDatabaseAvailable();

  if (!available) {
    return NextResponse.json({
      success: false,
      databaseAvailable: false,
      error: 'DATABASE_URL not configured',
    });
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json({
      success: false,
      databaseAvailable: false,
      error: 'Failed to create SQL client',
    });
  }

  try {
    // Check products table
    const productsResult = await sql`SELECT COUNT(*) as count FROM products` as [{ count: string }];

    // Check blog_posts table
    const blogResult = await sql`SELECT COUNT(*) as count FROM blog_posts` as [{ count: string }];

    // Check admin_users table
    const adminResult = await sql`SELECT COUNT(*) as count FROM admin_users` as [{ count: string }];

    // Get sample products
    const sampleProducts = await sql`SELECT id, slug, image, published FROM products LIMIT 5`;

    return NextResponse.json({
      success: true,
      databaseAvailable: true,
      tables: {
        products: { count: parseInt(productsResult[0].count), sample: sampleProducts },
        blog_posts: { count: parseInt(blogResult[0].count) },
        admin_users: { count: parseInt(adminResult[0].count) },
      },
    });
  } catch (error) {
    console.error('Database check failed:', error);
    return NextResponse.json({
      success: false,
      databaseAvailable: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Initialize database schema
export async function POST() {
  const { initializeDatabase } = await import('../../../lib/db');

  try {
    await initializeDatabase();
    return NextResponse.json({ success: true, message: 'Database initialized' });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Init failed',
    });
  }
}