import { describe, expect, it } from 'vitest';
import { CLOCK_RULES } from '@content/clock';
import { DEV_PRESETS } from '@content/dev/presets';
import { weatherAt } from '@core/clock/weather';
import { evalCond } from '@core/story/cond';
import { condCtx } from '@core/sim/systems/story';
import { Harness } from './harness';

const myr = { preset: DEV_PRESETS.myr } as const;

describe('rolled weather', () => {
  it('stays clear outside story weather while rolling is pinned off', () => {
    const h = new Harness(myr);
    for (let day = 1; day <= 20; day++) {
      h.sim.state.clock.day = day;
      expect(h.sim.weather()).toBe('clear');
    }
  });

  it('follows the region and season roll outdoors when rolled', () => {
    const h = new Harness({ ...myr, rolled: true });
    const seen = new Set<string>();
    const s = h.sim.state;
    for (let day = 1; day <= 40; day++) {
      s.clock.day = day;
      const kind = h.sim.weather();
      expect(kind).toBe(weatherAt(s.seed, day, s.clock.minute, 'myrkvidr', s.clock.season, CLOCK_RULES));
      seen.add(kind);
    }
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });

  it('is clear indoors, while the sky outside still counts for conditions', () => {
    const h = new Harness({ ...myr, rolled: true, screen: 'myr_int_hut', tile: [19, 14] });
    const s = h.sim.state;
    let day = 1;
    while (weatherAt(s.seed, day, s.clock.minute, 'myrkvidr', s.clock.season, CLOCK_RULES) !== 'rain') day++;
    s.clock.day = day;
    expect(h.sim.weather()).toBe('clear');
    expect(h.sim.sky()).toBe('rain');
    expect(h.sim.wind()).toEqual({ x: 0, y: 0 });
    expect(evalCond({ k: 'weather', is: 'rain' }, condCtx(h.sim))).toBe(true);
    expect(evalCond({ k: 'weather', is: ['fog', 'snow'] }, condCtx(h.sim))).toBe(false);
  });

  it('lets story weather beat the roll and the dev override beat both', () => {
    const h = new Harness({ preset: DEV_PRESETS.raid, screen: 'ask_farmyard', tile: [20, 12], rolled: true });
    expect(h.sim.weather()).toBe('storm');
    expect(Math.hypot(h.sim.wind().x, h.sim.wind().y)).toBeGreaterThan(0);
    h.sim.command({ t: 'weather', kind: 'fog' });
    h.idle(1);
    expect(h.sim.weather()).toBe('fog');
  });

  it('counts a missing weather reader as clear', () => {
    const h = new Harness(myr);
    expect(evalCond({ k: 'weather', is: 'clear' }, { state: h.sim.state, quests: {} })).toBe(true);
  });
});
