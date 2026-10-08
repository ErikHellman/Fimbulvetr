import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import { Harness } from './harness';

/** test_a as an open forge room, hot or not. */
function room(hot: boolean): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  const screen = { ...DB.screens.test_a, map, things: [], ...(hot ? { hot: true as const } : {}) };
  return { ...DB, screens: { ...DB.screens, test_a: screen } };
}

const H = DB.tuning.hero;

describe('heat in a hot room', () => {
  it('builds while Ask stands there, and shows on the HUD', () => {
    const h = new Harness({ db: room(true), tile: [20, 10] });
    expect(h.sim.heat()).toBeNull();
    h.idle(100);
    expect(h.sim.heat()).toEqual({ now: 100, max: H.heat });
  });

  it('burns half a heart a second once full, and goes on burning', () => {
    const h = new Harness({ db: room(true), tile: [20, 10] });
    const hp = h.sim.hero.hp;
    h.idle(H.heat - 1);
    expect(h.sim.hero.hp).toBe(hp);
    h.idle(2);
    expect(h.sim.hero.hp).toBe(hp - H.heatBurn);
    h.idle(60);
    expect(h.sim.hero.hp).toBe(hp - 2 * H.heatBurn);
    expect(h.sim.heat()?.now).toBe(H.heat);
  });

  it('is borne longer in the ember byrnie', () => {
    const h = new Harness({ db: room(true), tile: [20, 10] });
    h.sim.state.inv.armor = 'ember_byrnie';
    const hp = h.sim.hero.hp;
    h.idle(H.heat + 120);
    expect(h.sim.hero.hp).toBe(hp);
    expect(h.sim.heat()?.max).toBe(H.heatEmber);
  });

  it('never builds in a cool room, and drains away there', () => {
    const cool = new Harness({ db: room(false), tile: [20, 10] });
    cool.idle(100);
    expect(cool.sim.heat()).toBeNull();
    cool.sim.heatTicks = 400;
    cool.idle(50);
    expect(cool.sim.heat()?.now).toBe(200);
    cool.idle(50);
    expect(cool.sim.heat()).toBeNull();
  });
});
