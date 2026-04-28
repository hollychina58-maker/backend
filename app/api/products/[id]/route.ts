import { NextRequest, NextResponse } from 'next/server';
import { getProduct, updateProduct, deleteProduct } from '../../../../lib/product-data';
import { ProductInput } from '../../../../types/product';
import { getCorsHeaders } from '../../../../lib/cors';
import { requireAuth } from '../../../../lib/auth-middleware';
import { validateProductInput } from '../../../../lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const headers = getCorsHeaders(request.headers.get('origin'));
  try {
    const { id } = await params;
    const product = await getProduct(id);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404, headers }
      );
    }
    return NextResponse.json({ success: true, data: product }, { headers });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
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
    const validation = validateProductInput(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validation.error.issues },
        { status: 400, headers }
      );
    }
    const product = await updateProduct(id, body as Partial<ProductInput>);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404, headers }
      );
    }
    return NextResponse.json({ success: true, data: product }, { headers });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
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
    const deleted = await deleteProduct(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404, headers }
      );
    }
    return NextResponse.json({ success: true }, { headers });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const headers = getCorsHeaders(request.headers.get('origin'));
  return new NextResponse(null, { status: 204, headers });
}
