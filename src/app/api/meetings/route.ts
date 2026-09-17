import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  if (!getAuthUserFromRequest(request)) {
    return unauthorizedResponse();
  }

  const db = getDb();
  const meetings = db
    .prepare(`
      SELECT m.*, COALESCE(SUM(t.price), 0) as total_cost
      FROM meetings m
      LEFT JOIN tickets t ON t.meeting_id = m.id
      GROUP BY m.id
      ORDER BY m.start_date ASC
    `)
    .all() as Array<Record<string, unknown> & { id: number }>;

  const result = meetings.map((meeting) => {
    const tickets = db
      .prepare(`
        SELECT id, type, departure, arrival, hotel_name, price
        FROM tickets WHERE meeting_id = ?
      `)
      .all(meeting.id);
    return { ...meeting, tickets };
  });

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  if (!getAuthUserFromRequest(request)) {
    return unauthorizedResponse();
  }

  const body = await request.json();
  const { title, city, start_date, end_date, notes } = body;

  if (!title || !city || !start_date || !end_date) {
    return NextResponse.json({ error: '标题、城市、日期不能为空' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const db = getDb();
  const result = db
    .prepare(`
      INSERT INTO meetings (title, city, start_date, end_date, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(title, city, start_date, end_date, notes || null, now, now);

  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(meeting, { status: 201 });
}
