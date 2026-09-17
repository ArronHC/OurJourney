import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import { getDb } from '@/lib/db';
import type { TicketType, Traveler } from '@/types';

const TICKET_TYPES: TicketType[] = ['flight', 'train', 'hotel'];
const TRAVELERS: Traveler[] = ['a', 'b'];

function isTicketType(value: unknown): value is TicketType {
  return typeof value === 'string' && TICKET_TYPES.includes(value as TicketType);
}

function isTraveler(value: unknown): value is Traveler {
  return typeof value === 'string' && TRAVELERS.includes(value as Traveler);
}

function normalizeMeetingId(value: unknown) {
  const meetingId = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(meetingId) && meetingId > 0 ? meetingId : null;
}

export async function POST(request: NextRequest) {
  if (!getAuthUserFromRequest(request)) {
    return unauthorizedResponse();
  }

  const body = await request.json();
  const { meeting_id, type, traveler, ...fields } = body;
  const meetingId = normalizeMeetingId(meeting_id);

  if (!meetingId) {
    return NextResponse.json({ error: '见面记录不能为空' }, { status: 400 });
  }

  if (!isTicketType(type)) {
    return NextResponse.json({ error: '票据类型无效' }, { status: 400 });
  }

  if (!isTraveler(traveler)) {
    return NextResponse.json({ error: '票据归属无效' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const db = getDb();
  const meeting = db.prepare('SELECT id FROM meetings WHERE id = ?').get(meetingId);

  if (!meeting) {
    return NextResponse.json({ error: '见面记录不存在' }, { status: 404 });
  }

  const columns = ['meeting_id', 'type', 'traveler', 'created_at', 'updated_at'];
  const values: unknown[] = [meetingId, type, traveler, now, now];

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
