import { describe, expect, it } from 'vitest';
import { getPrompt, normalizeAiData, parseAiResponse } from '../../src/lib/ai';

describe('ai', () => {
  it('returns flight prompt for flight type', () => {
    const prompt = getPrompt('flight');
    expect(prompt).toContain('机票');
    expect(prompt).toContain('carrier');
    expect(prompt).toContain('trip_number');
  });

  it('returns train prompt for train type', () => {
    const prompt = getPrompt('train');
    expect(prompt).toContain('火车票');
  });

  it('returns hotel prompt for hotel type', () => {
    const prompt = getPrompt('hotel');
    expect(prompt).toContain('酒店');
    expect(prompt).toContain('hotel_name');
  });

  it('parses valid JSON response', () => {
    const raw = '{"type": "flight", "departure": "北京", "arrival": "上海", "price": 680}';
    const result = parseAiResponse(raw);
    expect(result.success).toBe(true);
    expect(result.detected_type).toBe('flight');
    expect(result.data?.departure).toBe('北京');
  });

  it('parses JSON wrapped in markdown code block', () => {
    const raw = '```json\n{"type": "flight", "departure": "北京", "price": 680}\n```';
    const result = parseAiResponse(raw);
    expect(result.success).toBe(true);
    expect(result.data?.departure).toBe('北京');
  });

  it('marks partial when fields are null', () => {
    const raw = '{"type": "flight", "departure": "北京", "arrival": null, "price": null}';
    const result = parseAiResponse(raw);
    expect(result.success).toBe(true);
    expect(result.partial).toBe(true);
  });

  it('uses provided type as override for compatibility', () => {
    const raw = '{"departure": "北京", "arrival": "上海", "price": 680}';
    const result = parseAiResponse(raw, 'train');
    expect(result.success).toBe(true);
    expect(result.detected_type).toBe('train');
    expect(result.data?.type).toBe('train');
  });

  it('returns failure when auto-detect response is missing type', () => {
    const raw = '{"departure": "北京", "arrival": "上海", "price": 680}';
    const result = parseAiResponse(raw);
    expect(result.success).toBe(false);
    expect(result.error).toBe('recognition_failed');
  });

  it('returns failure for unparseable response', () => {
    const raw = 'I cannot read this image';
    const result = parseAiResponse(raw);
    expect(result.success).toBe(false);
    expect(result.error).toBe('recognition_failed');
  });

  it('normalizes AI data to known fields and numeric values', () => {
    const result = normalizeAiData({
      type: 'flight',
      departure: '北京',
      price: '680.50',
      price_per_night: 'invalid',
      unexpected_field: 'ignored',
    });

    expect(result).toEqual({
      type: 'flight',
      departure: '北京',
      price: 680.5,
      price_per_night: null,
    });
  });

  it('parses normalized data without leaking unknown fields', () => {
    const raw =
      '{"type":"hotel","hotel_name":"外滩酒店","price":"1200","unexpected_field":"ignored"}';
    const result = parseAiResponse(raw);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      type: 'hotel',
      hotel_name: '外滩酒店',
      price: 1200,
    });
  });
});
