import { NextRequest, NextResponse } from 'next/server';
import {
  canCreateInvite,
  createInvite,
  getAuthUserFromRequest,
  getInvitesForUser,
  unauthorizedResponse,
} from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = getAuthUserFromRequest(request);
  if (!user) {
    return unauthorizedResponse();
  }

  return NextResponse.json(getInvitesForUser(user.id));
}

export async function POST(request: NextRequest) {
  const user = getAuthUserFromRequest(request);
  if (!user) {
    return unauthorizedResponse();
  }

  if (!canCreateInvite()) {
    return NextResponse.json({ error: '两位伴侣账号都已创建，无需再生成邀请码' }, { status: 400 });
  }

  try {
    return NextResponse.json(createInvite(user.id), { status: 201 });
  } catch {
    return NextResponse.json({ error: '邀请码生成失败，请重试' }, { status: 500 });
  }
}
