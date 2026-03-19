import { NextRequest, NextResponse } from 'next/server';
import { recognizeScreenshot } from '@/lib/gemini';
import { saveFile, validateFile } from '@/lib/upload';
import type { TicketType } from '@/types';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const image = formData.get('image') as File | null;
  const type = formData.get('type') as TicketType | null;

  if (!image || !type) {
    return NextResponse.json(
      { success: false, error: 'bad_request', message: '请提供截图和票据类型' },
      { status: 400 }
    );
  }

  if (!['flight', 'train', 'hotel'].includes(type)) {
    return NextResponse.json(
      { success: false, error: 'bad_request', message: '无效的票据类型' },
      { status: 400 }
    );
  }

  const validationError = validateFile(image);
  if (validationError) {
    return NextResponse.json(
      { success: false, error: 'bad_request', message: validationError },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await image.arrayBuffer());
  const screenshotPath = await saveFile(buffer, image.name, image.type);
  const base64 = buffer.toString('base64');
  const result = await recognizeScreenshot(base64, image.type, type);

  if (result.error === 'service_unavailable') {
    return NextResponse.json(
      { ...result, screenshot_path: screenshotPath },
      { status: 503 }
    );
  }

  return NextResponse.json({ ...result, screenshot_path: screenshotPath });
}
