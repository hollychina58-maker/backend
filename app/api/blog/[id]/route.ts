import { NextRequest, NextResponse } from 'next/server';
import { getPost, updatePost, deletePost } from '../../../../lib/blog-data';
import { BlogPostInput } from '../../../../types/blog';
import { getCorsHeaders } from '../../../../lib/cors';
import { requireAuth } from '../../../../lib/auth-middleware';
import { validateBlogPostInput } from '../../../../lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const headers = getCorsHeaders(request.headers.get('origin'));
  try {
    const { id } = await params;
    const post = await getPost(id);
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404, headers }
      );
    }
    return NextResponse.json({ success: true, data: post }, { headers });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch post' },
      { status: 500, headers }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const headers = getCorsHeaders(request.headers.get('origin'));
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const validation = validateBlogPostInput(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.issues },
        { status: 400, headers }
      );
    }
    const post = await updatePost(id, body as Partial<BlogPostInput>);
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404, headers }
      );
    }
    return NextResponse.json({ success: true, data: post }, { headers });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update post' },
      { status: 500, headers }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const headers = getCorsHeaders(request.headers.get('origin'));
  const authError = requireAuth(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const deleted = await deletePost(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404, headers }
      );
    }
    return NextResponse.json({ success: true }, { headers });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to delete post' },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const headers = getCorsHeaders(request.headers.get('origin'));
  return new NextResponse(null, { status: 204, headers });
}
