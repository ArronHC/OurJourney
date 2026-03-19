import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { meeting_id, type, traveler, ...fields } = body;

  if (!meeting_id || !type) {
    return NextResponse.json({ error: '见面记录和票据类型不能为空' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const db = getDb();
  const columns = ['meeting_id', 'type', 'traveler', 'created_at', 'updated_at'];
  const values: unknown[] = [meeting_id, type, traveler || 'a', now, now];

  const ticketFields = [
    'departure',
    'arrival',
    'departure_time',
    'arrival_time',
    'carrier',
    'trip_number',
    'seat_class',
    'hotel_name',
    'check_in',
    'check_out',
    'price_per_night',
    'price',
    'screenshot_path',
    'raw_ocr_data',
  ];

  for (const field of ticketFields) {
    if (fields[field] !== undefined) {
      columns.push(field);
      values.push(fields[field]);
    }
  }

  const placeholders = columns.map(() => '?').join(', ');
  const result = db
    .prepare(`INSERT INTO tickets (${columns.join(', ')}) VALUES (${placeholders})`)
    .run(...values);

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json(ticket, { status: 201 });
}
