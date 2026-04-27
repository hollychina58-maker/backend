import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOADCARE_PUBLIC_KEY = process.env.UPLOADCARE_PUBLIC_KEY;
const UPLOADCARE_SECRET_KEY = process.env.UPLOADCARE_SECRET_KEY;

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

    // Try Uploadcare first if configured
    if (UPLOADCARE_PUBLIC_KEY && UPLOADCARE_SECRET_KEY) {
      try {
        console.log('Attempting Uploadcare upload with key length:', UPLOADCARE_PUBLIC_KEY.length);
        url = await uploadToUploadcare(buffer, fileName, file.type);
        console.log('Uploaded to Uploadcare:', url);
      } catch (ucError) {
        console.error('Uploadcare upload failed, falling back to local:', ucError);
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

async function uploadToUploadcare(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
  // Uploadcare REST API - upload endpoint
  const formData = new FormData();
  const uint8Array = new Uint8Array(buffer);
  const blob = new Blob([uint8Array], { type: contentType });
  formData.append('file', blob, fileName);
  formData.append('pub_key', UPLOADCARE_PUBLIC_KEY!);

  const response = await fetch('https://upload.uploadcare.com/post/', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Uploadcare upload failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Uploadcare returns { file: "https://ucarecdn.com/uuid/filename" } or { uuid: "uuid" }
  // If file URL is returned, use it directly
  if (data.file) {
    return data.file;
  }

  // Otherwise construct the URL from uuid
  const uuid = data.uuid;
  if (!uuid) {
    throw new Error('Uploadcare response missing uuid');
  }

  // Return CDN URL
  return `https://ucarecdn.com/${uuid}/${encodeURIComponent(fileName)}`;
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
