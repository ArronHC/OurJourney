import { NextRequest, NextResponse } from 'next/server';
import { attachSessionCookie, createSession, findUserByEmail, verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!email || !password) {
    return NextResponse.json({ error: '请输入邮箱和密码' }, { status: 400 });
  }

  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
  }

  const session = createSession(user.id);
  const response = NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      invited_by_user_id: user.invited_by_user_id,
      created_at: user.created_at,
    },
  });

  attachSessionCookie(response, session);
  return response;
}
