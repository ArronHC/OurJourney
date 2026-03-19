import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  if (!getAuthUserFromRequest(request)) {
    return unauthorizedResponse();
  }

  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{
    key: string;
    value: string;
  }>;

  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }

  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  if (!getAuthUserFromRequest(request)) {
    return unauthorizedResponse();
  }

  const body = await request.json();
  const db = getDb();
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

  const transaction = db.transaction((entries: [string, string][]) => {
    for (const [key, value] of entries) {
      upsert.run(key, value);
    }
  });

  transaction(Object.entries(body));

  const rows = db.prepare('SELECT key, value FROM settings').all() as Array<{
    key: string;
    value: string;
  }>;

  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }

  return NextResponse.json(settings);
}
