import { NextRequest, NextResponse } from 'next/server';
import { getPosts, createPost } from '../../../lib/blog-data';
import { BlogPostInput } from '../../../types/blog';
import { getCorsHeaders } from '../../../lib/cors';
import { requireAuth } from '../../../lib/auth-middleware';
import { validateBlogPostInput } from '../../../lib/validation';
import { initializeDatabase } from '../../../lib/db';

export async function GET(request: NextRequest) {
  const headers = getCorsHeaders(request.headers.get('origin'));
  try {
    await initializeDatabase();
    const posts = await getPosts();
    return NextResponse.json({ success: true, data: posts }, { headers });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500, headers }
    );
  }
}

export async function POST(request: NextRequest) {
  const headers = getCorsHeaders(request.headers.get('origin'));
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    await initializeDatabase();
    const body = await request.json();
    const validation = validateBlogPostInput(body);
    if (!validation.success) {
      const errors = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json(
        { success: false, error: `Invalid input: ${errors}` },
        { status: 400, headers }
      );
    }
    const post = await createPost(body as BlogPostInput);
    return NextResponse.json({ success: true, data: post }, { status: 201, headers });
  } catch (error) {
    console.error('[Blog API] Failed to create post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const headers = getCorsHeaders(request.headers.get('origin'));
  return new NextResponse(null, { status: 204, headers });
}
