const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

async function backup() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  try {
    // Query products
    const products = await sql`SELECT id, slug, image, specs, published, content, created_at, updated_at FROM products ORDER BY created_at DESC`;
    const formattedProducts = products.map(p => ({
      id: p.id,
      slug: p.slug,
      image: p.image || '',
      specs: p.specs,
      published: p.published,
      content: p.content,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));

    fs.mkdirSync('data', { recursive: true });
    fs.writeFileSync('data/products.json', JSON.stringify(formattedProducts, null, 2));
    console.log('Backed up', formattedProducts.length, 'products');

    // Query blog posts
    const posts = await sql`SELECT id, slug, cover_image, tags, author, date, read_time, published, content, created_at, updated_at FROM blog_posts ORDER BY created_at DESC`;
    const formattedPosts = posts.map(p => ({
      id: p.id,
      slug: p.slug,
      coverImage: p.cover_image || '',
      tags: p.tags || [],
      author: p.author || '',
      date: p.date || '',
      readTime: p.read_time || '',
      published: p.published,
      content: p.content,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    }));

    fs.writeFileSync('data/blog.json', JSON.stringify(formattedPosts, null, 2));
    console.log('Backed up', formattedPosts.length, 'posts');

  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

backup();
