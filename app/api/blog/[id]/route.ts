import { NextRequest, NextResponse } from 'next/server';
import { getPost, updatePost, deletePost } from '../../../../lib/blog-data';
import { BlogPostInput } from '../../../../types/blog';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const post = await getPost(id);
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404, headers: corsHeaders }
      );
    }
    return NextResponse.json({ success: true, data: post }, { headers: corsHeaders });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch post' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const post = await updatePost(id, body as Partial<BlogPostInput>);
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404, headers: corsHeaders }
      );
    }
    return NextResponse.json({ success: true, data: post }, { headers: corsHeaders });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update post' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deletePost(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404, headers: corsHeaders }
      );
    }
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to delete post' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
