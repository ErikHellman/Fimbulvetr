import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { NEW_GAME } from '@content/start';
import { solve } from '@core/progress/solver';
import type { ContentDb } from '@core/sim/db';
import { newGame } from '@core/state/gameState';
import { TILE } from '@core/world/dims';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';

/**
 * test_a opened up: rapids across rows 10–13, a drawbridge over them at cols 18–19 that is down while
 * `w_myl_bridge` holds, its latch on the far bank at (19, 15), and a piece of heart beyond.
 */
function weirDb(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    if (y >= 10 && y <= 13) return '#' + 'v'.repeat(38) + '#';
    return '#' + '.'.repeat(38) + '#';
  });
  const things: Thing[] = [
    { k: 'bridge', at: { x: 18, y: 10 }, w: 2, h: 4, down: { k: 'flag', id: 'w_myl_bridge', eq: true } },
    { k: 'switch', at: { x: 19, y: 15 }, set: 'w_myl_bridge' },
    { k: 'piece', id: 'hp_test_far', at: { x: 30, y: 18 } },
  ];
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

function atTheWeir(boomerang: boolean): Harness {
  const h = new Harness({ db: weirDb(), tile: [19, 8], facing: 's' });
  if (boomerang) {
    h.sim.state.inv.items.boomerang = 1;
    h.sim.state.inv.slots = ['boomerang', null];
  }
  return h;
}
const row = (h: Harness): number => Math.floor((h.sim.hero.pos.y - 1) / TILE);
const latch = (h: Harness) => h.sim.actors.find((a) => a.kind === 'fixture' && a.def === 'switch');

describe('the weir latch and its drawbridge', () => {
  it('keeps Ask on the near bank while the bridge is up', () => {
    const h = atTheWeir(false);
    h.hold(['down'], 120);
    expect(row(h)).toBeLessThan(10);
    expect(h.sim.state.flags.w_myl_bridge).toBeUndefined();
  });

  it('drops when the boomerang strikes the latch across the rapids, for good', () => {
    const h = atTheWeir(true);
    h.press(['item1']);
    h.until(() => h.sim.state.flags.w_myl_bridge === true, 60);
    expect(h.sim.state.flags.w_myl_bridge).toBe(true);
    h.idle(40);
    h.hold(['down'], 150);
    expect(row(h)).toBeGreaterThan(13);
    h.sim.command({ t: 'warp', screen: 'test_a', x: 19 * TILE + 8, y: 8 * TILE + 14 });
    h.idle(2);
    expect(latch(h)?.mem['lit']).toBe(1);
    expect(h.sim.actors.find((a) => a.def === 'bridge')?.anim).toBe('down');
    h.hold(['down'], 150);
    expect(row(h)).toBeGreaterThan(13);
  });
});

describe('the solver and the latch', () => {
  const start = (boomerang: boolean) => {
    const s = newGame(1, NEW_GAME);
    s.hero.screen = 'test_a';
    s.hero.x = 19 * TILE + 8;
    s.hero.y = 8 * TILE + 14;
    if (boomerang) s.inv.items.boomerang = 1;
    return s;
  };
  it('crosses only once the boomerang can strike the latch', () => {
    const db = weirDb();
    const none = (): boolean => false;
    expect(solve(db, start(false), none).pieces).not.toContain('hp_test_far');
    const r = solve(db, start(true), none);
    expect(r.pieces).toContain('hp_test_far');
    expect(r.stranded).toEqual([]);
  });
});
