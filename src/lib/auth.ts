import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import type { AuthStatus, AuthUser } from '@/types';
import { getDb } from './db';

const SESSION_COOKIE = 'journey_session';
const SESSION_DAYS = 30;
const MAX_USERS = 2;

type UserRow = AuthUser & {
  password_hash: string;
};

function getNowIso() {
  return new Date().toISOString();
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function toSafeUser(user: UserRow | AuthUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    invited_by_user_id: user.invited_by_user_id,
    created_at: user.created_at,
  };
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, 'hex');
  const actual = Buffer.from(scryptSync(password, salt, 64).toString('hex'), 'hex');

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

export function getUserCount() {
  const db = getDb();
  const result = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  return result.count;
}

export function getAuthStatus(request: NextRequest): AuthStatus {
  const user = getAuthUserFromRequest(request);
  const userCount = getUserCount();

  return {
    authenticated: Boolean(user),
    user,
    user_count: userCount,
    can_register_without_invite: userCount === 0,
  };
}

export function getAuthUserFromRequest(request: NextRequest): AuthUser | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const db = getDb();
  const row = db
    .prepare(
      `
        SELECT u.id, u.email, u.display_name, u.invited_by_user_id, u.created_at
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > ?
      `
    )
    .get(hashToken(token), getNowIso()) as AuthUser | undefined;

  return row || null;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: '请先登录' }, { status: 401 });
}

export function validatePassword(password: string) {
  return password.length >= 8;
}

export function findUserByEmail(email: string) {
  const db = getDb();
  return (
    db
      .prepare(
        'SELECT id, email, display_name, password_hash, invited_by_user_id, created_at FROM users WHERE email = ?'
      )
      .get(email.trim().toLowerCase()) as UserRow | undefined
  );
}

export function createUser(input: {
  email: string;
  displayName: string;
  password: string;
  invitedByUserId?: number | null;
}) {
  const db = getDb();
  const now = getNowIso();
  const result = db
    .prepare(
      `
        INSERT INTO users (email, display_name, password_hash, invited_by_user_id, created_at)
        VALUES (?, ?, ?, ?, ?)
      `
    )
    .run(
      input.email.trim().toLowerCase(),
      input.displayName.trim(),
      hashPassword(input.password),
      input.invitedByUserId ?? null,
      now
    );

  const user = db
    .prepare(
      'SELECT id, email, display_name, password_hash, invited_by_user_id, created_at FROM users WHERE id = ?'
    )
    .get(result.lastInsertRowid) as UserRow;

  return toSafeUser(user);
}

export function createSession(userId: number) {
  const db = getDb();
  const token = randomBytes(32).toString('hex');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  db.prepare(
    `
      INSERT INTO sessions (user_id, token_hash, expires_at, created_at)
      VALUES (?, ?, ?, ?)
    `
  ).run(userId, hashToken(token), expiresAt.toISOString(), now.toISOString());

  return { token, expiresAt };
}

export function attachSessionCookie(
  response: NextResponse,
  session: { token: string; expiresAt: Date }
) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: session.token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: session.expiresAt,
    path: '/',
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    path: '/',
  });
}

export function deleteSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return;
  }

  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
}

export function generateInviteCode() {
  return randomBytes(4).toString('hex').toUpperCase();
}

export function createInvite(createdByUserId: number) {
  const db = getDb();
  const now = getNowIso();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateInviteCode();
    try {
      const result = db
        .prepare(
          `
            INSERT INTO invite_codes (code, created_by_user_id, created_at)
            VALUES (?, ?, ?)
          `
        )
        .run(code, createdByUserId, now);

      return db
        .prepare(
          `
            SELECT id, code, created_by_user_id, created_at, used_at, used_by_user_id
            FROM invite_codes
            WHERE id = ?
          `
        )
        .get(result.lastInsertRowid);
    } catch {
      continue;
    }
  }

  throw new Error('invite_generation_failed');
}

export function getInvitesForUser(userId: number) {
  const db = getDb();
  return db
    .prepare(
      `
        SELECT i.id, i.code, i.created_by_user_id, i.created_at, i.used_at, i.used_by_user_id, u.display_name as used_by_name
        FROM invite_codes i
        LEFT JOIN users u ON u.id = i.used_by_user_id
        WHERE i.created_by_user_id = ?
        ORDER BY i.created_at DESC
      `
    )
    .all(userId);
}

export function getUsableInvite(code: string) {
  const db = getDb();
  return db
    .prepare(
      `
        SELECT id, code, created_by_user_id, created_at, used_at, used_by_user_id
        FROM invite_codes
        WHERE code = ? AND used_at IS NULL
      `
    )
    .get(code.trim().toUpperCase()) as
    | {
        id: number;
        code: string;
        created_by_user_id: number;
        created_at: string;
        used_at: string | null;
        used_by_user_id: number | null;
      }
    | undefined;
}

export function markInviteAsUsed(inviteId: number, usedByUserId: number) {
  const db = getDb();
  db.prepare(
    `
      UPDATE invite_codes
      SET used_at = ?, used_by_user_id = ?
      WHERE id = ?
    `
  ).run(getNowIso(), usedByUserId, inviteId);
}

export function canRegisterWithInvite(code?: string | null) {
  const userCount = getUserCount();

  if (userCount === 0) {
    return { allowed: true, invite: null as ReturnType<typeof getUsableInvite> | null };
  }

  if (userCount >= MAX_USERS) {
    return { allowed: false, reason: '两位伴侣账号都已创建' };
  }

  if (!code) {
    return { allowed: false, reason: '请输入邀请码' };
  }

  const invite = getUsableInvite(code);
  if (!invite) {
    return { allowed: false, reason: '邀请码无效或已被使用' };
  }

  return { allowed: true, invite };
}

export function canCreateInvite() {
  return getUserCount() < MAX_USERS;
}
