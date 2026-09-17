import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { deleteFile } from '@/lib/upload';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!getAuthUserFromRequest(request)) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const db = getDb();
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(Number(id));

  if (!ticket) {
    return NextResponse.json({ error: '票据不存在' }, { status: 404 });
  }

  return NextResponse.json(ticket);
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
  const now = new Date().toISOString();
  const db = getDb();
  const existingTicket = db
    .prepare('SELECT screenshot_path FROM tickets WHERE id = ?')
    .get(Number(id)) as { screenshot_path: string | null } | undefined;

  if (!existingTicket) {
    return NextResponse.json({ error: '票据不存在' }, { status: 404 });
  }

  const fields = [
    'type',
    'meeting_id',
    'traveler',
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

  const setClauses: string[] = ['updated_at = ?'];
  const values: unknown[] = [now];

  for (const field of fields) {
    if (body[field] !== undefined) {
      setClauses.push(`${field} = ?`);
      values.push(body[field]);
    }
  }

  values.push(Number(id));
  db.prepare(`UPDATE tickets SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);

  if (
    body.screenshot_path !== undefined &&
    existingTicket.screenshot_path &&
    body.screenshot_path !== existingTicket.screenshot_path
  ) {
    deleteFile(existingTicket.screenshot_path);
  }

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(Number(id));
  return NextResponse.json(ticket);
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
  const ticket = db.prepare('SELECT screenshot_path FROM tickets WHERE id = ?').get(Number(id)) as
    | { screenshot_path: string | null }
    | undefined;

  if (!ticket) {
    return NextResponse.json({ error: '票据不存在' }, { status: 404 });
  }

  if (ticket.screenshot_path) {
    deleteFile(ticket.screenshot_path);
  }

  db.prepare('DELETE FROM tickets WHERE id = ?').run(Number(id));
  return NextResponse.json({ success: true });
}
