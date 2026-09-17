import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import { recognizeScreenshot } from '@/lib/ai';
import { saveFile, validateFile } from '@/lib/upload';
import type { TicketType } from '@/types';

const TICKET_TYPES: TicketType[] = ['flight', 'train', 'hotel'];

export async function POST(request: NextRequest) {
  if (!getAuthUserFromRequest(request)) {
    console.error('recognize unauthorized');
    return unauthorizedResponse();
  }

  const formData = await request.formData();
  const image = formData.get('image') as File | null;
  const rawType = formData.get('type');
  const type =
    typeof rawType === 'string' && TICKET_TYPES.includes(rawType as TicketType)
      ? (rawType as TicketType)
      : null;

  if (!image) {
    console.error('recognize bad request missing fields', {
      hasImage: Boolean(image),
      rawType,
    });
    return NextResponse.json(
      { success: false, error: 'bad_request', message: '请提供截图' },
      { status: 400 }
    );
  }

  if (rawType !== null && type === null) {
    console.error('recognize bad request invalid type', { rawType });
    return NextResponse.json(
      { success: false, error: 'bad_request', message: '无效的票据类型' },
      { status: 400 }
    );
  }

  const validationError = validateFile(image);
  if (validationError) {
    console.error('recognize validation failed', {
      type,
      mimeType: image.type,
      size: image.size,
      validationError,
    });
    return NextResponse.json(
      { success: false, error: 'bad_request', message: validationError },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await image.arrayBuffer());
  console.error('recognize request received', {
    type,
    rawType,
    mimeType: image.type,
    size: image.size,
  });
  const screenshotPath = await saveFile(buffer, image.name, image.type);
  const base64 = buffer.toString('base64');
  const result = await recognizeScreenshot(base64, image.type, type ?? undefined);

  if (result.error === 'service_unavailable') {
    console.error('recognize service unavailable', {
      type,
      screenshotPath,
      message: result.message,
    });
    return NextResponse.json(
      { ...result, screenshot_path: screenshotPath },
      { status: 503 }
    );
  }

  console.error('recognize completed', {
    type,
    screenshotPath,
    success: result.success,
    error: result.error,
    partial: result.partial,
  });
  return NextResponse.json({ ...result, screenshot_path: screenshotPath });
}
