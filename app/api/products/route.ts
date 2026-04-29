import { NextRequest, NextResponse } from 'next/server';
import { getProducts, createProduct } from '../../../lib/product-data';
import { ProductInput } from '../../../types/product';
import { getCorsHeaders } from '../../../lib/cors';
import { requireAuth } from '../../../lib/auth-middleware';
import { validateProductInput } from '../../../lib/validation';

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
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const validation = validateProductInput(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input' },
        { status: 400, headers }
      );
    }
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
