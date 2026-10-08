import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import { windOf } from '@core/sim/systems/weather';
import { length } from '@core/math/vec';
import { BLIZZARD_RADIUS, BLIZZARD_THICK } from '@core/world/light';
import { Harness } from './harness';

/** test_a as an open field in Hrímfjöll (or in Askdalr), with no frost so only the wind acts. */
function field(region: 'hrimfjoll' | 'askdalr'): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '∴'.repeat(38) + '#',
  );
  const screen = { ...DB.screens.test_a, map, things: [], region };
  return { ...DB, screens: { ...DB.screens, test_a: screen } };
}

describe('a blizzard', () => {
  it('is a snow day in Hrímfjöll, and nowhere else', () => {
    const h = new Harness({ db: field('hrimfjoll'), tile: [20, 10] });
    expect(h.sim.blizzard()).toBe(false);
    h.sim.command({ t: 'weather', kind: 'snow' });
    h.idle(1);
    expect(h.sim.blizzard()).toBe(true);
    expect(h.sim.fog()).toEqual({ amount: BLIZZARD_THICK, r: BLIZZARD_RADIUS });
    const low = new Harness({ db: field('askdalr'), tile: [20, 10] });
    low.sim.command({ t: 'weather', kind: 'snow' });
    low.idle(1);
    expect(low.sim.blizzard()).toBe(false);
  });

  it('pushes Ask gently along the wind', () => {
    const h = new Harness({ db: field('hrimfjoll'), tile: [20, 10] });
    h.sim.command({ t: 'weather', kind: 'snow' });
    h.idle(1);
    const wind = windOf(h.sim);
    const p = { ...h.sim.hero.pos };
    h.idle(20);
    const moved = { x: h.sim.hero.pos.x - p.x, y: h.sim.hero.pos.y - p.y };
    expect(length(moved)).toBeCloseTo(20 * DB.tuning.hero.gust, 3);
    expect(moved.x * wind.x + moved.y * wind.y).toBeGreaterThan(0);
  });

  it('leaves Ask be in plain snow', () => {
    const h = new Harness({ db: field('askdalr'), tile: [20, 10] });
    h.sim.command({ t: 'weather', kind: 'snow' });
    h.idle(1);
    const p = { ...h.sim.hero.pos };
    h.idle(20);
    expect(h.sim.hero.pos).toEqual(p);
  });
});
