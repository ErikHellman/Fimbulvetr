import { describe, expect, it } from 'vitest';
import { DARK_ROOM, FOG_THICK, NIGHT_DARK, STORM_DARK, darknessOf, fogOf } from '@core/world/light';

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

describe('fog', () => {
  it('hangs outdoors in fog, day and night, and nowhere else', () => {
    expect(fogOf({ ...out, weather: 'fog' })).toBe(FOG_THICK);
    expect(fogOf(out)).toBe(0);
    expect(fogOf({ ...out, weather: 'fog', indoor: true })).toBe(0);
    expect(fogOf({ ...out, weather: 'fog', dark: true })).toBe(0);
  });

  it('does not darken the day by itself', () => {
    expect(darknessOf(1, { ...out, weather: 'fog' })).toBe(0);
  });
});
