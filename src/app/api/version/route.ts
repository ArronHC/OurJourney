import { NextResponse } from 'next/server';

const buildId = process.env.NEXT_PUBLIC_APP_BUILD_ID || 'unknown';

export async function GET() {
  const response = NextResponse.json({ build_id: buildId });
  response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
}
