import { describe, expect, it } from 'vitest';
import { CLOCK_RULES } from '@content/clock';
import { weatherAt } from '@core/clock/weather';

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
    const counts = { clear: 0, rain: 0, wind: 0, fog: 0, snow: 0 };
    const days = 10_000;
    for (let day = 1; day <= days; day++)
      counts[weatherAt(9, day, 480, 'askdalr', 'summer', CLOCK_RULES)] += 1;
    expect(counts.clear / days).toBeCloseTo(0.6, 1);
    expect(counts.rain / days).toBeCloseTo(0.25, 1);
    expect(counts.wind / days).toBeCloseTo(0.15, 1);
  });
});
