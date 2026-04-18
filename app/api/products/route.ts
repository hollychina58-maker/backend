import { NextRequest, NextResponse } from 'next/server';
import { getProducts, createProduct } from '../../../lib/product-data';
import { ProductInput } from '../../../types/product';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json({ success: true, data: products }, { headers: corsHeaders });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const product = await createProduct(body as ProductInput);
    return NextResponse.json({ success: true, data: product }, { status: 201, headers: corsHeaders });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
