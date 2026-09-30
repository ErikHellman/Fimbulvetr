import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { NEW_GAME } from '@content/start';
import { solve } from '@core/progress/solver';
import type { ContentDb } from '@core/sim/db';
import { newGame, type GameState } from '@core/state/gameState';
import { TILE } from '@core/world/dims';
import type { Thing } from '@core/world/screen';

/**
 * test_a as a crypt room: floor walled round, a band of pits across rows 8–13 with a bridge over it at
 * cols 18–19 (down while `w_myl_bridge`, standing in for a room's latch), and a piece beyond.
 */
function room(things: Thing[]): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '8'.repeat(40);
    if (y >= 8 && y <= 13) return '8' + '0'.repeat(38) + '8';
    return '8' + '7'.repeat(38) + '8';
  });
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

const bridge: Thing = {
  k: 'bridge',
  at: { x: 18, y: 8 },
  w: 2,
  h: 6,
  down: { k: 'flag', id: 'w_myl_bridge', eq: true },
};
const piece: Thing = { k: 'piece', id: 'hp_test_far', at: { x: 30, y: 18 } };

function start(bow: boolean, boomerang = false): GameState {
  const s = newGame(1, NEW_GAME);
  s.hero.screen = 'test_a';
  s.hero.x = 19 * TILE + 8;
  s.hero.y = 4 * TILE + 14;
  if (bow) s.inv.items.bow = 1;
  if (boomerang) s.inv.items.boomerang = 1;
  return s;
}

const none = (): boolean => false;
const within = { within: ['test_a' as const] };

describe('the solver and the bow', () => {
  it('lights an eye across the pits only with the bow (never the boomerang)', () => {
    const db = room([bridge, { k: 'switch', at: { x: 19, y: 16 }, set: 'w_myl_bridge', eye: true }, piece]);
    expect(solve(db, start(false, true), none, within).pieces).not.toContain('hp_test_far');
    const r = solve(db, start(true), none, within);
    expect(r.pieces).toContain('hp_test_far');
    expect(r.stranded).toEqual([]);
  });

  it('shoots a plain switch across the pits too, but only along a straight line', () => {
    const straight = room([bridge, { k: 'switch', at: { x: 19, y: 16 }, set: 'w_myl_bridge' }, piece]);
    expect(solve(straight, start(true), none, within).pieces).toContain('hp_test_far');
    const aside = room([bridge, { k: 'switch', at: { x: 5, y: 20 }, set: 'w_myl_bridge', eye: true }, piece]);
    // Thirteen tiles straight down from the nearest reachable tile: beyond an arrow's reach.
    expect(solve(aside, start(true), none, within).pieces).not.toContain('hp_test_far');
  });

  it('counts a mini-boss as a foe for a room’s clear, and never as the dungeon’s boss', () => {
    const db: ContentDb = {
      ...DB,
      screens: {
        ...DB.screens,
        test_a: {
          ...DB.screens.test_a,
          dungeon: 'd3',
          things: [
            { k: 'enemy', id: 'haugvordr', at: { x: 30, y: 10 } },
            { k: 'chest', id: 'c_bow', at: { x: 30, y: 4 }, gives: { item: 'bow' }, appear: 'clear' },
          ],
        },
      },
    };
    const s = start(false);
    s.hero.x = 10 * TILE + 8;
    s.hero.y = 10 * TILE + 14;
    const r = solve(db, s, (st) => (st.inv.items.bow ?? 0) > 0, within);
    expect(r.finishable).toBe(true);
    expect(r.opened).toContain('c_bow');
  });
});
