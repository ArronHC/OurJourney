import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { initSchema } from '../../src/lib/db';

describe('Database schema', () => {
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

  it('creates meetings table', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='meetings'")
      .get();
    expect(tables).toBeTruthy();
  });

  it('creates tickets table', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tickets'")
      .get();
    expect(tables).toBeTruthy();
  });

  it('creates settings table', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'")
      .get();
    expect(tables).toBeTruthy();
  });

  it('inserts and retrieves a meeting', () => {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO meetings (title, city, start_date, end_date, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run('情人节', '上海', '2025-02-14', '2025-02-16', null, now, now);

    const meeting = db.prepare('SELECT * FROM meetings WHERE id = 1').get() as {
      title: string;
      city: string;
    };
    expect(meeting.title).toBe('情人节');
    expect(meeting.city).toBe('上海');
  });

  it('inserts a ticket linked to a meeting', () => {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO meetings (title, city, start_date, end_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('测试', '北京', '2025-01-01', '2025-01-03', now, now);

    db.prepare(`
      INSERT INTO tickets (meeting_id, type, traveler, departure, arrival, price, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(1, 'flight', 'a', '北京', '上海', 680, now, now);

    const ticket = db.prepare('SELECT * FROM tickets WHERE meeting_id = 1').get() as {
      type: string;
      price: number;
    };
    expect(ticket.type).toBe('flight');
    expect(ticket.price).toBe(680);
  });

  it('cascades delete from meeting to tickets', () => {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO meetings (title, city, start_date, end_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('测试', '北京', '2025-01-01', '2025-01-03', now, now);

    db.prepare(`
      INSERT INTO tickets (meeting_id, type, traveler, departure, arrival, price, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(1, 'train', 'b', '上海', '北京', 553, now, now);

    db.prepare('DELETE FROM meetings WHERE id = 1').run();
    const tickets = db.prepare('SELECT * FROM tickets WHERE meeting_id = 1').all();
    expect(tickets).toHaveLength(0);
  });

  it('upserts settings', () => {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
      .run('relationship_start_date', '2024-06-01');
    const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get(
      'relationship_start_date'
    ) as { value: string };
    expect(setting.value).toBe('2024-06-01');

    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
      .run('relationship_start_date', '2024-07-01');
    const updatedSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get(
      'relationship_start_date'
    ) as { value: string };
    expect(updatedSetting.value).toBe('2024-07-01');
  });
});
