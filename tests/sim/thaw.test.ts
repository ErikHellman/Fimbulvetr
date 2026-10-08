import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { seasonAt, thawed } from '@core/clock/clock';
import type { ContentDb } from '@core/sim/db';
import { Harness } from './harness';

/** test_a as a cold snowfield on the mountain. */
function mountain(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  const screen = { ...DB.screens.test_a, map, things: [], region: 'hrimfjoll' as const, cold: true as const };
  return { ...DB, screens: { ...DB.screens, test_a: screen } };
}

describe('spring on the mountain (M10b)', () => {
  it('keeps Hrímfjöll in winter until the Rime King is dead, then lets it follow the calendar', () => {
    const c = { ...new Harness().sim.state.clock, season: 'spring' as const };
    expect(seasonAt(c, 'hrimfjoll', DB.clock)).toBe('winter');
    expect(seasonAt(c, 'hrimfjoll', DB.clock, {})).toBe('winter');
    expect(seasonAt(c, 'hrimfjoll', DB.clock, { st_hrimnir_dead: true })).toBe('spring');
    expect(thawed('hrimfjoll', DB.clock, { st_hrimnir_dead: true })).toBe(true);
    expect(thawed('askdalr', DB.clock, { st_hrimnir_dead: true })).toBe(false);
  });

  it('gives the thawed mountain skies of its own: no snow in summer', () => {
    const summer = DB.clock.regionWeather?.hrimfjoll?.summer ?? {};
    expect(summer.snow ?? 0).toBe(0);
  });

  it('stops the killing frost once the King is dead', () => {
    const h = new Harness({ db: mountain(), tile: [20, 10] });
    h.sim.state.flags.st_hrimnir_dead = true;
    const hp = h.sim.hero.hp;
    h.idle(DB.tuning.hero.cold + 120);
    expect(h.sim.hero.hp).toBe(hp);
    expect(h.sim.cold()).toBeNull();
  });
});
