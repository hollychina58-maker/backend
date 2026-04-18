import { NextRequest, NextResponse } from 'next/server';
import { getPosts, createPost } from '../../../lib/blog-data';
import { BlogPostInput } from '../../../types/blog';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET() {
  try {
    const posts = await getPosts();
    return NextResponse.json({ success: true, data: posts }, { headers: corsHeaders });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const post = await createPost(body as BlogPostInput);
    return NextResponse.json({ success: true, data: post }, { status: 201, headers: corsHeaders });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
