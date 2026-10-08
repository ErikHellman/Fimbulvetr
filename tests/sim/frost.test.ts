import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import { Harness } from './harness';

/** test_a as an open snowfield, under the killing frost or not. */
function field(cold: boolean): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  const screen = { ...DB.screens.test_a, map, things: [], ...(cold ? { cold: true as const } : {}) };
  return { ...DB, screens: { ...DB.screens, test_a: screen } };
}

const H = DB.tuning.hero;

describe('the killing frost', () => {
  it('builds while Ask stands in it, and shows on the HUD', () => {
    const h = new Harness({ db: field(true), tile: [20, 10] });
    expect(h.sim.cold()).toBeNull();
    h.idle(100);
    expect(h.sim.cold()).toEqual({ now: 100, max: H.cold });
  });

  it('takes half a heart a second once full, and goes on taking it', () => {
    const h = new Harness({ db: field(true), tile: [20, 10] });
    const hp = h.sim.hero.hp;
    h.idle(H.cold - 1);
    expect(h.sim.hero.hp).toBe(hp);
    h.idle(2);
    expect(h.sim.hero.hp).toBe(hp - H.coldBurn);
    h.idle(60);
    expect(h.sim.hero.hp).toBe(hp - 2 * H.coldBurn);
    expect(h.sim.cold()?.now).toBe(H.cold);
  });

  it('never touches Ask in the ember byrnie', () => {
    const h = new Harness({ db: field(true), tile: [20, 10] });
    h.sim.state.inv.armor = 'ember_byrnie';
    const hp = h.sim.hero.hp;
    h.idle(H.cold + 120);
    expect(h.sim.hero.hp).toBe(hp);
    expect(h.sim.cold()).toBeNull();
  });

  it('never builds out of the frost, and drains away there', () => {
    const warm = new Harness({ db: field(false), tile: [20, 10] });
    warm.idle(100);
    expect(warm.sim.cold()).toBeNull();
    warm.sim.coldTicks = 200;
    warm.idle(25);
    expect(warm.sim.cold()?.now).toBe(100);
    warm.idle(25);
    expect(warm.sim.cold()).toBeNull();
  });

  it('spares Ask in god mode', () => {
    const h = new Harness({ db: field(true), tile: [20, 10] });
    h.sim.god = true;
    const hp = h.sim.hero.hp;
    h.idle(H.cold + 120);
    expect(h.sim.hero.hp).toBe(hp);
  });
});
