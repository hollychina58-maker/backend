import { NextRequest, NextResponse } from 'next/server';
import { getPosts, createPost } from '../../../lib/blog-data';
import { BlogPostInput } from '../../../types/blog';
import { getCorsHeaders } from '../../../lib/cors';

export async function GET(request: NextRequest) {
  const headers = getCorsHeaders(request.headers.get('origin'));
  try {
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
  try {
    const body = await request.json();
    const post = await createPost(body as BlogPostInput);
    return NextResponse.json({ success: true, data: post }, { status: 201, headers });
  } catch {
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
