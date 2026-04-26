import { NextResponse } from 'next/server';

export async function GET() {
  const html = 'google-site-verification: google725caac4b1bcad46.html';
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}