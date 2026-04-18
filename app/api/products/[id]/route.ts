import { NextRequest, NextResponse } from 'next/server';
import { getProduct, updateProduct, deleteProduct } from '../../../../lib/product-data';
import { ProductInput } from '../../../../types/product';

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
    const product = await getProduct(id);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404, headers: corsHeaders }
      );
    }
    return NextResponse.json({ success: true, data: product }, { headers: corsHeaders });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
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
    const product = await updateProduct(id, body as Partial<ProductInput>);
    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404, headers: corsHeaders }
      );
    }
    return NextResponse.json({ success: true, data: product }, { headers: corsHeaders });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
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
    const deleted = await deleteProduct(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404, headers: corsHeaders }
      );
    }
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
