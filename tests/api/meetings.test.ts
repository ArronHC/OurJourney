import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initSchema } from '../../src/lib/db';

describe('Meetings queries', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  });

  afterEach(() => {
    db.close();
  });

  it('lists meetings in chronological order', () => {
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO meetings (title, city, start_date, end_date, created_at, updated_at) VALUES (?,?,?,?,?,?)'
    ).run('元旦', '北京', '2025-01-01', '2025-01-03', now, now);
    db.prepare(
      'INSERT INTO meetings (title, city, start_date, end_date, created_at, updated_at) VALUES (?,?,?,?,?,?)'
    ).run('情人节', '上海', '2025-02-14', '2025-02-16', now, now);

    const meetings = db.prepare('SELECT * FROM meetings ORDER BY start_date ASC').all() as {
      title: string;
    }[];
    expect(meetings[0].title).toBe('元旦');
    expect(meetings[1].title).toBe('情人节');
  });

  it('includes ticket cost summary', () => {
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO meetings (title, city, start_date, end_date, created_at, updated_at) VALUES (?,?,?,?,?,?)'
    ).run('测试', '上海', '2025-02-14', '2025-02-16', now, now);
    db.prepare(
      'INSERT INTO tickets (meeting_id, type, traveler, price, created_at, updated_at) VALUES (?,?,?,?,?,?)'
    ).run(1, 'flight', 'a', 680, now, now);
    db.prepare(
      'INSERT INTO tickets (meeting_id, type, traveler, price, created_at, updated_at) VALUES (?,?,?,?,?,?)'
    ).run(1, 'hotel', 'a', 1860, now, now);

    const result = db
      .prepare(`
        SELECT m.*, COALESCE(SUM(t.price), 0) as total_cost
        FROM meetings m LEFT JOIN tickets t ON t.meeting_id = m.id
        WHERE m.id = ?
        GROUP BY m.id
      `)
      .get(1) as { total_cost: number };

    expect(result.total_cost).toBe(2540);
  });
});
