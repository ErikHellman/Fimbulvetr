import { describe, expect, it } from 'vitest';
import { CLOCK_RULES } from '@content/clock';
import { daylight, isNight, seasonAt, setMinute, setSeason, tickClock } from '@core/clock/clock';
import { newClock, type ClockEvent, type ClockState } from '@core/clock/types';

function minutes(c: ClockState, n: number): ClockEvent[] {
  const out: ClockEvent[] = [];
  for (let i = 0; i < n * CLOCK_RULES.ticksPerMinute; i++) out.push(...tickClock(c, CLOCK_RULES));
  return out;
}

describe('world clock', () => {
  it('advances one minute per 60 ticks', () => {
    const c = newClock();
    for (let i = 0; i < 59; i++) tickClock(c, CLOCK_RULES);
    expect(c.minute).toBe(480);
    tickClock(c, CLOCK_RULES);
    expect(c.minute).toBe(481);
  });

  it('honours a slower tick rate (long day)', () => {
    const c = newClock();
    for (let i = 0; i < 60; i++) tickClock(c, CLOCK_RULES, 120);
    expect(c.minute).toBe(480);
  });

  it('rolls over to a new day', () => {
    const c = newClock();
    setMinute(c, 1439);
    expect(minutes(c, 1)).toContainEqual({ t: 'newDay', day: 2 });
    expect([c.minute, c.day]).toEqual([0, 2]);
  });

  it('announces dawn and dusk once each', () => {
    const c = newClock();
    setMinute(c, 0);
    const events = minutes(c, 1440);
    expect(events.filter((e) => e.t === 'dawn')).toHaveLength(1);
    expect(events.filter((e) => e.t === 'dusk')).toHaveLength(1);
  });

  it('keeps a held season, and turns a cycling one after seasonDays', () => {
    const held = newClock();
    minutes(held, 1440 * 10);
    expect(held.season).toBe('summer');

    const cycling = { ...newClock(), policy: 'cycling' as const };
    const events = minutes(cycling, 1440 * CLOCK_RULES.seasonDays);
    expect(cycling.season).toBe('autumn');
    expect(cycling.epoch).toBe(1);
    expect(events).toContainEqual({ t: 'season', from: 'summer', to: 'autumn' });
  });

  it('lets the story set the season', () => {
    const c = newClock();
    expect(setSeason(c, 'winter')).toEqual([{ t: 'season', from: 'summer', to: 'winter' }]);
    expect(c.epoch).toBe(1);
    expect(setSeason(c, 'winter')).toEqual([]);
  });

  it('knows night by season', () => {
    const c = { ...newClock(), season: 'winter' as const };
    setMinute(c, 6 * 60 + 30);
    expect(isNight(c, CLOCK_RULES)).toBe(true);
    setMinute(c, 7 * 60 + 30);
    expect(isNight(c, CLOCK_RULES)).toBe(false);
    setMinute(c, 19 * 60 + 30);
    expect(isNight(c, CLOCK_RULES)).toBe(true);
  });

  it('ramps daylight smoothly through dawn', () => {
    const c = newClock();
    setMinute(c, 12 * 60);
    expect(daylight(c, CLOCK_RULES)).toBe(1);
    setMinute(c, 0);
    expect(daylight(c, CLOCK_RULES)).toBe(0);
    const sunrise = CLOCK_RULES.sunrise.summer;
    setMinute(c, sunrise);
    expect(daylight(c, CLOCK_RULES)).toBeCloseTo(0.5);
    let last = -1;
    for (let m = sunrise - 60; m <= sunrise + 60; m++) {
      setMinute(c, m);
      const d = daylight(c, CLOCK_RULES);
      expect(d).toBeGreaterThanOrEqual(last);
      last = d;
    }
  });

  it('keeps Hrímfjöll in winter', () => {
    expect(seasonAt(newClock(), 'hrimfjoll', CLOCK_RULES)).toBe('winter');
    expect(seasonAt(newClock(), 'askdalr', CLOCK_RULES)).toBe('summer');
  });
});
