import { describe, expect, it } from 'vitest';
import { CITY_COORDS, getDistance, matchCity } from '../../src/lib/cities';

describe('cities', () => {
  it('has at least 30 cities', () => {
    expect(Object.keys(CITY_COORDS).length).toBeGreaterThanOrEqual(30);
  });

  it('calculates Beijing-Shanghai distance ~1068km', () => {
    const distance = getDistance('北京', '上海');
    expect(distance).toBeGreaterThan(1000);
    expect(distance).toBeLessThan(1200);
  });

  it('returns 0 for unknown city', () => {
    const distance = getDistance('北京', '未知城市');
    expect(distance).toBe(0);
  });

  it('fuzzy matches city names', () => {
    expect(matchCity('北京首都')).toBe('北京');
    expect(matchCity('上海虹桥')).toBe('上海');
    expect(matchCity('广州')).toBe('广州');
  });

  it('returns null for unmatched city', () => {
    expect(matchCity('火星')).toBeNull();
  });
});
