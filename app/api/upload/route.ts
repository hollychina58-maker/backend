import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2, isR2Configured } from '../../../lib/r2-upload';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '没有文件' }, { status: 400, headers: corsHeaders });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '请上传图片文件' }, { status: 400, headers: corsHeaders });
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '图片大小不能超过10MB' }, { status: 400, headers: corsHeaders });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const ext = path.extname(file.name);
    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9]/g, '-');
    const fileName = `${baseName}-${timestamp}${ext}`;

    let url: string;

    // Try R2 first, fall back to local storage
    if (isR2Configured()) {
      try {
        url = await uploadToR2(buffer, fileName, file.type);
        console.log('Uploaded to R2:', url);
      } catch (r2Error) {
        console.error('R2 upload failed, falling back to local:', r2Error);
        url = await saveLocally(buffer, fileName);
      }
    } else {
      url = await saveLocally(buffer, fileName);
    }

    return NextResponse.json({ url }, { headers: corsHeaders });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: '上传失败' }, { status: 500, headers: corsHeaders });
  }
}

async function saveLocally(buffer: Buffer, fileName: string): Promise<string> {
  const uploadDir = path.join(process.cwd(), 'public', 'images', 'products');
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, fileName);
  await writeFile(filePath, buffer);

  return `/images/products/${fileName}`;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
