import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { deleteFile } from '@/lib/upload';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAuthUserFromRequest(_request)) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const db = getDb();
  const meeting = db
    .prepare(`
      SELECT m.*, COALESCE(SUM(t.price), 0) as total_cost
      FROM meetings m LEFT JOIN tickets t ON t.meeting_id = m.id
      WHERE m.id = ? GROUP BY m.id
    `)
    .get(Number(id)) as Record<string, unknown> | undefined;

  if (!meeting) {
    return NextResponse.json({ error: '见面记录不存在' }, { status: 404 });
  }

  const tickets = db
    .prepare('SELECT * FROM tickets WHERE meeting_id = ? ORDER BY created_at')
    .all(Number(id));
  return NextResponse.json({ ...meeting, tickets });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAuthUserFromRequest(request)) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const body = await request.json();
  const { title, city, start_date, end_date, notes } = body;
  const now = new Date().toISOString();
  const db = getDb();

  db.prepare(`
    UPDATE meetings SET title = ?, city = ?, start_date = ?, end_date = ?, notes = ?, updated_at = ?
    WHERE id = ?
  `).run(title, city, start_date, end_date, notes || null, now, Number(id));

  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(Number(id));
  return NextResponse.json(meeting);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAuthUserFromRequest(_request)) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const db = getDb();

  const tickets = db
    .prepare('SELECT screenshot_path FROM tickets WHERE meeting_id = ?')
    .all(Number(id)) as Array<{ screenshot_path: string | null }>;

  for (const ticket of tickets) {
    if (ticket.screenshot_path) {
      deleteFile(ticket.screenshot_path);
    }
  }

  db.prepare('DELETE FROM meetings WHERE id = ?').run(Number(id));
  return NextResponse.json({ success: true });
}
