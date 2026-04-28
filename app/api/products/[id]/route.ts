import { NextRequest, NextResponse } from 'next/server';
import { getProduct, updateProduct, deleteProduct } from '../../../../lib/product-data';
import { ProductInput } from '../../../../types/product';
import { getCorsHeaders } from '../../../../lib/cors';

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
  try {
    const { id } = await params;
    const body = await request.json();
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
