import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, deleteSessionFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  deleteSessionFromRequest(request);
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
