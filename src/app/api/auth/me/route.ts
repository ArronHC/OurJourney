import { NextRequest, NextResponse } from 'next/server';
import { getAuthStatus } from '@/lib/auth';

export async function GET(request: NextRequest) {
  return NextResponse.json(getAuthStatus(request));
}
