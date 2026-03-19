import { NextResponse } from 'next/server';
import { getDistance, getDistanceFunFact } from '@/lib/cities';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const meetings = db
    .prepare(`
      SELECT m.*, COALESCE(SUM(t.price), 0) as total_cost
      FROM meetings m LEFT JOIN tickets t ON t.meeting_id = m.id
      GROUP BY m.id ORDER BY m.start_date DESC
    `)
    .all() as Array<{
      id: number;
      title: string;
      start_date: string;
      end_date: string;
      total_cost: number;
    }>;

  if (meetings.length === 0) {
    return NextResponse.json({
      meeting_count: 0,
      total_cost: 0,
      total_distance_km: 0,
      total_days_together: 0,
      avg_cost_per_meeting: 0,
      avg_monthly_frequency: 0,
      avg_days_per_meeting: 0,
      distance_fun_fact: '',
      cost_per_meeting: [],
    });
  }

  const totalCost = meetings.reduce((sum, meeting) => sum + meeting.total_cost, 0);

  const totalDays = meetings.reduce((sum, meeting) => {
    const start = new Date(meeting.start_date);
    const end = new Date(meeting.end_date);
    return sum + Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  }, 0);

  const transportTickets = db
    .prepare(`
      SELECT departure, arrival
      FROM tickets
      WHERE type IN ('flight', 'train') AND departure IS NOT NULL AND arrival IS NOT NULL
    `)
    .all() as Array<{ departure: string; arrival: string }>;

  let totalDistance = 0;
  for (const ticket of transportTickets) {
    totalDistance += getDistance(ticket.departure, ticket.arrival);
  }

  const firstDate = new Date(meetings[meetings.length - 1].start_date);
  const lastDate = new Date(meetings[0].start_date);
  const monthSpan = Math.max(
    1,
    (lastDate.getTime() - firstDate.getTime()) / (30.44 * 86400000) + 1
  );

  const costPerMeeting = meetings
    .map((meeting) => ({
      meeting_id: meeting.id,
      title: meeting.title,
      cost: meeting.total_cost,
    }))
    .reverse();

  return NextResponse.json({
    meeting_count: meetings.length,
    total_cost: totalCost,
    total_distance_km: totalDistance,
    total_days_together: totalDays,
    avg_cost_per_meeting: Math.round(totalCost / meetings.length),
    avg_monthly_frequency: Math.round((meetings.length / monthSpan) * 10) / 10,
    avg_days_per_meeting: Math.round((totalDays / meetings.length) * 10) / 10,
    distance_fun_fact: getDistanceFunFact(totalDistance),
    cost_per_meeting: costPerMeeting,
  });
}
