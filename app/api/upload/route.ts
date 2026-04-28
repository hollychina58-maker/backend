import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getCorsHeaders } from '../../../lib/cors';
import { requireAuth } from '../../../lib/auth-middleware';

const UPLOADCARE_PUBLIC_KEY = process.env.UPLOADCARE_PUBLIC_KEY;
const UPLOADCARE_SECRET_KEY = process.env.UPLOADCARE_SECRET_KEY;

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// Magic byte signatures for image validation
const MAGIC_BYTES: Record<string, number[][]> = {
  '.jpg': [[0xFF, 0xD8, 0xFF]],
  '.jpeg': [[0xFF, 0xD8, 0xFF]],
  '.png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  '.gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
  '.webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF header
};

function validateMagicBytes(buffer: Buffer, ext: string): boolean {
  const signatures = MAGIC_BYTES[ext];
  if (!signatures) return false;

  for (const signature of signatures) {
    if (buffer.slice(0, signature.length).equals(Buffer.from(signature))) {
      return true;
    }
  }

  // For webp, also check RIFF container
  if (ext === '.webp' && buffer.length >= 12) {
    const riff = buffer.slice(0, 4).toString('ascii');
    const webp = buffer.slice(8, 12).toString('ascii');
    if (riff === 'RIFF' && webp === 'WEBP') {
      return true;
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  const headers = getCorsHeaders(request.headers.get('origin'));
  const authError = requireAuth(request);
  if (authError) return authError;
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: '没有文件' }, { status: 400, headers });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '请上传图片文件' }, { status: 400, headers });
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '图片大小不能超过10MB' }, { status: 400, headers });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename with validated extension
    const timestamp = Date.now();
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: '不支持的图片格式' }, { status: 400, headers });
    }

    // Validate magic bytes to confirm actual file type
    if (!validateMagicBytes(buffer, ext)) {
      return NextResponse.json({ error: '文件类型验证失败' }, { status: 400, headers });
    }

    const baseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9]/g, '-');
    const fileName = `${baseName}-${timestamp}${ext}`;

    let url: string;

    // Try Uploadcare first if configured
    if (UPLOADCARE_PUBLIC_KEY && UPLOADCARE_SECRET_KEY) {
      try {
        url = await uploadToUploadcare(buffer, fileName, file.type);
      } catch {
        url = await saveLocally(buffer, fileName);
      }
    } else {
      url = await saveLocally(buffer, fileName);
    }

    return NextResponse.json({ url }, { headers });
  } catch {
    return NextResponse.json({ error: '上传失败' }, { status: 500, headers });
  }
}

async function uploadToUploadcare(buffer: Buffer, fileName: string, contentType: string): Promise<string> {
  // Uploadcare REST API - upload endpoint
  const formData = new FormData();
  const uint8Array = new Uint8Array(buffer);
  const blob = new Blob([uint8Array], { type: contentType });
  formData.append('file', blob, fileName);
  formData.append('UPLOADCARE_PUB_KEY', UPLOADCARE_PUBLIC_KEY!);

  const response = await fetch('https://upload.uploadcare.com/base/', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Uploadcare upload failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Uploadcare returns { file: "uuid" }
  if (!data.file) {
    throw new Error('Uploadcare response missing file uuid');
  }

  const cdnHost = process.env.UPLOADCARE_CDN_HOST || 'ucarecdn.com';
  // Return CDN URL - use custom CDN domain if configured
  return `https://${cdnHost}/${data.file}/${encodeURIComponent(fileName)}`;
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

export async function OPTIONS(request: NextRequest) {
  const headers = getCorsHeaders(request.headers.get('origin'));
  return new NextResponse(null, { status: 204, headers });
}
