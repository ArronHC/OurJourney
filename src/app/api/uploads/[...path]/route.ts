import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getAbsolutePath } from '@/lib/upload';

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const relPath = pathSegments.join('/');
  const absPath = getAbsolutePath(relPath);

  if (!fs.existsSync(absPath)) {
    return NextResponse.json({ error: '文件不存在' }, { status: 404 });
  }

  const ext = path.extname(absPath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const buffer = fs.readFileSync(absPath);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000',
    },
  });
}
