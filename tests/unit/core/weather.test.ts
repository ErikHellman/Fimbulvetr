import { describe, expect, it } from 'vitest';
import { CLOCK_RULES } from '@content/clock';
import { WIND_DIRS, windAt, weatherAt } from '@core/clock/weather';

describe('weather', () => {
  it('is a pure function of seed, day, minute and region', () => {
    expect(weatherAt(5, 3, 600, 'myrkvidr', 'autumn', CLOCK_RULES)).toBe(
      weatherAt(5, 3, 600, 'myrkvidr', 'autumn', CLOCK_RULES),
    );
  });

  it('never rolls weather the season does not allow', () => {
    for (let day = 1; day <= 1000; day++) {
      expect(weatherAt(1, day, 900, 'askdalr', 'winter', CLOCK_RULES)).not.toBe('rain');
      expect(weatherAt(1, day, 900, 'askdalr', 'summer', CLOCK_RULES)).not.toBe('snow');
    }
  });

  it('follows the season table in the morning', () => {
    const counts = { clear: 0, rain: 0, wind: 0, fog: 0, snow: 0, storm: 0 };
    const days = 10_000;
    for (let day = 1; day <= days; day++)
      counts[weatherAt(9, day, 480, 'askdalr', 'summer', CLOCK_RULES)] += 1;
    expect(counts.clear / days).toBeCloseTo(0.6, 1);
    expect(counts.rain / days).toBeCloseTo(0.25, 1);
    expect(counts.wind / days).toBeCloseTo(0.15, 1);
  });

  it('follows a region’s own table where it has one: no rain in Niflmýrr, snow in its winter', () => {
    const kinds = new Set<string>();
    for (const season of ['summer', 'autumn', 'winter', 'spring'] as const)
      for (let day = 1; day <= 500; day++) {
        const k = weatherAt(1, day, 900, 'niflmyrr', season, CLOCK_RULES);
        kinds.add(k);
        expect(k).not.toBe('rain');
        if (season !== 'winter') expect(k).not.toBe('snow');
      }
    expect(kinds).toContain('snow');
  });
});

describe('wind', () => {
  it('blows one of eight ways, the same all day, and is still in clear air and fog', () => {
    const seen = new Set<string>();
    for (let day = 1; day <= 200; day++) {
      const w = windAt(3, day, 'myrkvidr', 'wind');
      expect(w).toEqual(windAt(3, day, 'myrkvidr', 'wind'));
      expect(Math.hypot(w.x, w.y)).toBeCloseTo(0.5, 5);
      seen.add(`${w.x.toFixed(3)},${w.y.toFixed(3)}`);
      expect(windAt(3, day, 'myrkvidr', 'clear')).toEqual({ x: 0, y: 0 });
      expect(windAt(3, day, 'myrkvidr', 'fog')).toEqual({ x: 0, y: 0 });
    }
    expect(seen.size).toBe(WIND_DIRS.length);
  });

  it('is stronger in a storm and gentle in snow', () => {
    const storm = windAt(1, 4, 'askdalr', 'storm');
    const snow = windAt(1, 4, 'askdalr', 'snow');
    expect(Math.hypot(storm.x, storm.y)).toBeGreaterThan(Math.hypot(snow.x, snow.y));
    expect(Math.hypot(snow.x, snow.y)).toBeGreaterThan(0);
  });
});
