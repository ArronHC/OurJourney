import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return '仅支持 JPG、PNG、WebP 格式';
  }

  if (file.size > MAX_SIZE) {
    return '图片过大，请压缩后重试（最大 10MB）';
  }

  return null;
}

export async function saveFile(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  void mimeType;

  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const ext = filename.split('.').pop() || 'jpg';
  const savedName = `${uuidv4()}.${ext}`;
  const relPath = `${year}/${month}/${savedName}`;
  const absDir = path.join(UPLOAD_DIR, year, month);

  if (!fs.existsSync(absDir)) {
    fs.mkdirSync(absDir, { recursive: true });
  }

  fs.writeFileSync(path.join(absDir, savedName), buffer);
  return relPath;
}

export function deleteFile(relPath: string): void {
  const absPath = path.join(UPLOAD_DIR, relPath);
  if (fs.existsSync(absPath)) {
    fs.unlinkSync(absPath);
  }
}

export function getAbsolutePath(relPath: string): string {
  return path.join(UPLOAD_DIR, relPath);
}
