import { describe, expect, it } from 'vitest';
import { getPrompt, parseGeminiResponse } from '../../src/lib/gemini';

describe('gemini', () => {
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
    const raw = '{"departure": "北京", "arrival": "上海", "price": 680}';
    const result = parseGeminiResponse(raw);
    expect(result.success).toBe(true);
    expect(result.data?.departure).toBe('北京');
  });

  it('parses JSON wrapped in markdown code block', () => {
    const raw = '```json\n{"departure": "北京", "price": 680}\n```';
    const result = parseGeminiResponse(raw);
    expect(result.success).toBe(true);
    expect(result.data?.departure).toBe('北京');
  });

  it('marks partial when fields are null', () => {
    const raw = '{"departure": "北京", "arrival": null, "price": null}';
    const result = parseGeminiResponse(raw);
    expect(result.success).toBe(true);
    expect(result.partial).toBe(true);
  });

  it('returns failure for unparseable response', () => {
    const raw = 'I cannot read this image';
    const result = parseGeminiResponse(raw);
    expect(result.success).toBe(false);
    expect(result.error).toBe('recognition_failed');
  });
});
