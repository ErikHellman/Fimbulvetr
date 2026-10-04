import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { NEW_GAME } from '@content/start';
import { solve } from '@core/progress/solver';
import type { ContentDb } from '@core/sim/db';
import { newGame, type GameState } from '@core/state/gameState';
import { TILE } from '@core/world/dims';
import type { Thing } from '@core/world/screen';

/** test_a as a crypt room: floor walled round, a band of pits across rows 9–12, and a piece beyond. */
function room(things: Thing[], band: (y: number) => string = () => '0'.repeat(38)): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '8'.repeat(40);
    if (y >= 9 && y <= 12) return '8' + band(y) + '8';
    return '8' + '7'.repeat(38) + '8';
  });
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

const piece: Thing = { k: 'piece', id: 'hp_test_far', at: { x: 30, y: 18 } };

function start(grapple: boolean): GameState {
  const s = newGame(1, NEW_GAME);
  s.hero.screen = 'test_a';
  s.hero.x = 19 * TILE + 8;
  s.hero.y = 4 * TILE + 14;
  if (grapple) s.inv.items.grapple = 1;
  return s;
}

const none = (): boolean => false;
const within = { within: ['test_a' as const] };

describe('the solver and the grapple', () => {
  it('crosses the pits to a post on the far side only with the grapple, one way', () => {
    const db = room([{ k: 'post', at: { x: 19, y: 14 } }, piece]);
    expect(solve(db, start(false), none, within).pieces).not.toContain('hp_test_far');
    const r = solve(db, start(true), none, within);
    expect(r.pieces).toContain('hp_test_far');
    // Nothing pulls Ask back north: the far side is stranded.
    expect(r.stranded.length).toBeGreaterThan(0);
  });

  it('returns by a second post facing back', () => {
    const db = room([{ k: 'post', at: { x: 19, y: 14 } }, { k: 'post', at: { x: 21, y: 7 } }, piece]);
    const r = solve(db, start(true), none, within);
    expect(r.pieces).toContain('hp_test_far');
    expect(r.stranded).toEqual([]);
  });

  it('reaches at most six tiles, and never through a wall', () => {
    // Pits across rows 9–14, so the post at row 16 is eight tiles from the last floor at row 8.
    const far = room([{ k: 'post', at: { x: 19, y: 16 } }, piece]);
    const map = [...far.screens.test_a.map];
    map[13] = '8' + '0'.repeat(38) + '8';
    map[14] = '8' + '0'.repeat(38) + '8';
    const db = { ...far, screens: { ...far.screens, test_a: { ...far.screens.test_a, map } } };
    expect(solve(db, start(true), none, within).pieces).not.toContain('hp_test_far');
    const walled = room([{ k: 'post', at: { x: 19, y: 14 } }, piece], (y) =>
      y === 10 ? '8'.repeat(38) : '0'.repeat(38),
    );
    expect(solve(walled, start(true), none, within).pieces).not.toContain('hp_test_far');
  });
});

describe('the solver and rafts', () => {
  it('rides a raft across the pits to its far stop, and back', () => {
    // Pits across rows 5–16; the raft rests at rows 5–6 and 15–16.
    const base = room([{ k: 'raft', at: { x: 19, y: 5 }, path: [{ x: 19, y: 15 }] }, piece]);
    const map = base.screens.test_a.map.map((row, y) =>
      y >= 5 && y <= 16 ? '8' + '0'.repeat(38) + '8' : row,
    );
    const db = { ...base, screens: { ...base.screens, test_a: { ...base.screens.test_a, map } } };
    const r = solve(db, start(false), none, within);
    expect(r.pieces).toContain('hp_test_far');
    expect(r.stranded).toEqual([]);
  });
});
