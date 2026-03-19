import { NextRequest, NextResponse } from 'next/server';
import {
  attachSessionCookie,
  canRegisterWithInvite,
  createSession,
  createUser,
  findUserByEmail,
  markInviteAsUsed,
  validatePassword,
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = String(body.email || '').trim().toLowerCase();
  const displayName = String(body.display_name || '').trim();
  const password = String(body.password || '');
  const inviteCode = body.invite_code ? String(body.invite_code) : null;

  if (!email || !displayName || !password) {
    return NextResponse.json({ error: '请完整填写注册信息' }, { status: 400 });
  }

  if (!validatePassword(password)) {
    return NextResponse.json({ error: '密码至少需要 8 位' }, { status: 400 });
  }

  if (findUserByEmail(email)) {
    return NextResponse.json({ error: '该邮箱已注册' }, { status: 409 });
  }

  const permission = canRegisterWithInvite(inviteCode);
  if (!permission.allowed) {
    return NextResponse.json({ error: permission.reason }, { status: 400 });
  }

  const user = createUser({
    email,
    displayName,
    password,
    invitedByUserId: permission.invite?.created_by_user_id ?? null,
  });

  if (permission.invite) {
    markInviteAsUsed(permission.invite.id, user.id);
  }

  const session = createSession(user.id);
  const response = NextResponse.json({ success: true, user }, { status: 201 });
  attachSessionCookie(response, session);
  return response;
}
