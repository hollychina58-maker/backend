import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import fs from 'fs/promises';
import path from 'path';

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

    // Create admin_users table
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id VARCHAR(50) PRIMARY KEY DEFAULT 'admin',
        password_hash VARCHAR(255) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create analytics tables
    await sql`
      CREATE TABLE IF NOT EXISTS page_views (
        id SERIAL PRIMARY KEY,
        visitor_id VARCHAR(32) NOT NULL,
        page_url TEXT NOT NULL,
        country VARCHAR(2),
        language VARCHAR(5),
        referrer TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS product_clicks (
        id SERIAL PRIMARY KEY,
        visitor_id VARCHAR(32) NOT NULL,
        product_id VARCHAR(50) NOT NULL,
        country VARCHAR(2),
        language VARCHAR(5),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    console.log('Database schema initialized successfully');

    // Auto-recovery: if tables are empty, restore from JSON backup
    await autoRestoreFromBackup(sql);
  } catch (error) {
    console.error('Failed to initialize database schema:', error);
    throw error;
  }
}

// Auto-restore from JSON backup if database is empty
async function autoRestoreFromBackup(sql: SqlType): Promise<void> {
  try {
    // Check products table
    const productCount = await sql`SELECT COUNT(*) FROM products` as [{ count: string }];
    if (parseInt(productCount[0].count) === 0) {
      console.log('Products table is empty, attempting to restore from JSON backup...');
      await restoreProductsFromJson(sql);
    }

    // Check blog_posts table
    const postCount = await sql`SELECT COUNT(*) FROM blog_posts` as [{ count: string }];
    if (parseInt(postCount[0].count) === 0) {
      console.log('Blog posts table is empty, attempting to restore from JSON backup...');
      await restorePostsFromJson(sql);
    }
  } catch (error) {
    console.error('Auto-recovery check failed:', error);
  }
}

async function restoreProductsFromJson(sql: SqlType): Promise<void> {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'products.json');
    const content = await fs.readFile(dataPath, 'utf-8');
    const products = JSON.parse(content);

    for (const product of products) {
      try {
        await sql`
          INSERT INTO products (id, slug, image, specs, published, content, created_at, updated_at)
          VALUES (
            ${product.id},
            ${product.slug},
            ${product.image || ''},
            ${JSON.stringify(product.specs)}::jsonb,
            ${product.published ?? false},
            ${JSON.stringify(product.content)}::jsonb,
            ${product.createdAt || new Date().toISOString()},
            ${product.updatedAt || new Date().toISOString()}
          )
        `;
      } catch (e) {
        // Skip duplicates
      }
    }
    console.log(`Restored ${products.length} products from JSON backup`);
  } catch (error) {
    console.error('Failed to restore products from JSON:', error);
  }
}

async function restorePostsFromJson(sql: SqlType): Promise<void> {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'blog.json');
    const content = await fs.readFile(dataPath, 'utf-8');
    const posts = JSON.parse(content);

    for (const post of posts) {
      try {
        await sql`
          INSERT INTO blog_posts (id, slug, cover_image, tags, author, date, read_time, published, content, created_at, updated_at)
          VALUES (
            ${post.id},
            ${post.slug},
            ${post.coverImage || ''},
            ${JSON.stringify(post.tags)}::jsonb,
            ${post.author || ''},
            ${post.date || null},
            ${post.readTime || ''},
            ${post.published ?? false},
            ${JSON.stringify(post.content)}::jsonb,
            ${post.createdAt || new Date().toISOString()},
            ${post.updatedAt || new Date().toISOString()}
          )
        `;
      } catch (e) {
        // Skip duplicates
      }
    }
    console.log(`Restored ${posts.length} posts from JSON backup`);
  } catch (error) {
    console.error('Failed to restore posts from JSON:', error);
  }
}
