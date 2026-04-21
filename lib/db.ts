import { neon, NeonQueryFunction } from '@neondatabase/serverless';

// Database connection type
type SqlType = NeonQueryFunction<false, false>;

// SQL client - initialized lazily
let _sql: SqlType | null = null;

function getSql(): SqlType | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  if (!_sql) {
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

// Check if database is available
export function isDatabaseAvailable(): boolean {
  return getSql() !== null;
}

// Get the SQL client (may be null if DATABASE_URL not set)
export function getDb(): SqlType | null {
  return getSql();
}

// Initialize database schema
export async function initializeDatabase(): Promise<void> {
  const sql = getSql();
  if (!sql) {
    console.warn('DATABASE_URL not set, skipping database initialization');
    return;
  }

  try {
    // Create products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        slug VARCHAR(100) NOT NULL,
        image TEXT,
        specs JSONB NOT NULL DEFAULT '{}',
        published BOOLEAN NOT NULL DEFAULT false,
        content JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create blog_posts table
    await sql`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id VARCHAR(50) PRIMARY KEY,
        slug VARCHAR(100) NOT NULL,
        cover_image TEXT,
        tags JSONB NOT NULL DEFAULT '[]',
        author VARCHAR(100),
        date DATE,
        read_time VARCHAR(20),
        published BOOLEAN NOT NULL DEFAULT false,
        content JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
    throw error;
  }
}
