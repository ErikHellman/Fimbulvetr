import { describe, expect, it } from 'vitest';
import { DARK_ROOM, NIGHT_DARK, STORM_DARK, darknessOf } from '@core/world/light';

const out = { indoor: false, dark: false, weather: 'clear' } as const;

describe('darkness', () => {
  it('is none by day and deepest at night, outdoors', () => {
    expect(darknessOf(1, out)).toBe(0);
    expect(darknessOf(0.6, out)).toBe(0);
    expect(darknessOf(0, out)).toBeCloseTo(NIGHT_DARK);
    expect(darknessOf(0.3, out)).toBeGreaterThan(0);
    expect(darknessOf(0.3, out)).toBeLessThan(NIGHT_DARK);
  });

  it('is deeper under a storm, but a storm by day is not dark', () => {
    expect(darknessOf(0, { ...out, weather: 'storm' })).toBeCloseTo(NIGHT_DARK + STORM_DARK);
    expect(darknessOf(1, { ...out, weather: 'storm' })).toBe(0);
  });

  it('never falls indoors, and always fills a dark room', () => {
    expect(darknessOf(0, { ...out, indoor: true })).toBe(0);
    expect(darknessOf(1, { ...out, dark: true })).toBe(DARK_ROOM);
  });
});
