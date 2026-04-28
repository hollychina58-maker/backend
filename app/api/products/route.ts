import { NextRequest, NextResponse } from 'next/server';
import { getProducts, createProduct } from '../../../lib/product-data';
import { ProductInput } from '../../../types/product';
import { getCorsHeaders } from '../../../lib/cors';

export async function GET(request: NextRequest) {
  const headers = getCorsHeaders(request.headers.get('origin'));
  try {
    const products = await getProducts();
    return NextResponse.json({ success: true, data: products }, { headers });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500, headers }
    );
  }
}

export async function POST(request: NextRequest) {
  const headers = getCorsHeaders(request.headers.get('origin'));
  try {
    const body = await request.json();
    const product = await createProduct(body as ProductInput);
    return NextResponse.json({ success: true, data: product }, { status: 201, headers });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500, headers }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const headers = getCorsHeaders(request.headers.get('origin'));
  return new NextResponse(null, { status: 204, headers });
}
