import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { NEW_GAME } from '@content/start';
import { solve, type SolveOptions } from '@core/progress/solver';
import type { ContentDb } from '@core/sim/db';
import { dungeonOf } from '@core/state/dungeons';
import { newGame, type GameState } from '@core/state/gameState';
import { tileFeet, type Thing } from '@core/world/screen';

/**
 * A one-room fixture on test_a (a d1 room with Sökkva Kvern's water): a wall down column 20 whose only gap
 * is a sluice floor at (20, 10), dry at level 0 and flooded from level 1; a pocket in the south-west corner
 * behind race planks at (4, 17), which float from level 1; extra `walls`; and the given things.
 */
function room(things: Thing[], walls: readonly (readonly [number, number])[] = []): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    const row = ('#' + '.'.repeat(38) + '#').split('');
    row[20] = y === 10 ? '1' : '#';
    if (y === 17) for (let x = 1; x < 20; x++) row[x] = x === 4 ? '3' : '#';
    for (const [wx, wy] of walls) if (wy === y) row[wx] = '#';
    return row.join('');
  });
  const screen = { ...DB.screens.test_a, map, things, dungeon: 'd1' as const, water: 'w_d2_level' as const };
  return { ...DB, screens: { ...DB.screens, test_a: screen } };
}

function start(over: (s: GameState) => void = () => undefined): GameState {
  const s = newGame(1, NEW_GAME);
  s.hero.screen = 'test_a';
  const p = tileFeet({ x: 5, y: 10 });
  s.hero.x = p.x;
  s.hero.y = p.y;
  over(s);
  return s;
}

const LEVELS: SolveOptions = { within: ['test_a'], levels: true };
const nothing = (): boolean => false;
const chest = (id: string, x: number, y: number): Thing => ({
  k: 'chest',
  id,
  at: { x, y },
  gives: { item: 'cheese' },
});

describe('the solver with water levels', () => {
  it('turns a wheel to float the planks to a chest', () => {
    const db = room([{ k: 'wheel', at: { x: 8, y: 5 }, level: 1 }, chest('c_pocket', 4, 19)]);
    expect(solve(db, start(), nothing, LEVELS).opened).toContain('c_pocket');
  });

  it('leaves screens with water out unless searching levels', () => {
    const db = room([]);
    expect(() => solve(db, start(), nothing, { within: ['test_a'] })).toThrow(/levels/);
  });

  it('catches Ask stranded by a wheel that floods the only way back', () => {
    const db = room([{ k: 'wheel', at: { x: 30, y: 5 }, level: 1 }, chest('c_far', 30, 15)]);
    const r = solve(db, start(), nothing, LEVELS);
    expect(r.opened).toContain('c_far');
    expect(r.stranded.length).toBeGreaterThan(0);
    expect(r.stranded).toContain('test_a 30,10');
  });

  it('is content once a wheel on the far side drains it again', () => {
    const db = room([
      { k: 'wheel', at: { x: 30, y: 5 }, level: 1 },
      { k: 'wheel', at: { x: 32, y: 5 }, level: 0 },
      chest('c_far', 30, 15),
    ]);
    expect(solve(db, start(), nothing, LEVELS).stranded).toEqual([]);
  });

  it('will not turn a wheel that would change the footing under Ask', () => {
    // The only spot to strike this wheel from is the sluice itself: flooding it there is refused.
    const walled = room(
      [{ k: 'wheel', at: { x: 20, y: 9 }, level: 1 }, chest('c_pocket', 4, 19)],
      [
        [19, 9],
        [21, 9],
      ],
    );
    expect(solve(walled, start(), nothing, LEVELS).opened).not.toContain('c_pocket');
  });

  it('blows a crack open only with bombs, and opens the big lock with the big key', () => {
    const things: Thing[] = [
      { k: 'crack', id: 'k_test', at: { x: 20, y: 10 }, w: 1, h: 1, art: 'wall' },
      chest('c_far', 30, 15),
    ];
    expect(solve(room(things), start(), nothing, LEVELS).opened).not.toContain('c_far');
    const bombs = start((s) => (s.inv.items.bombs = 0));
    const opened = solve(room(things), bombs, nothing, LEVELS);
    expect(opened.opened).toEqual(expect.arrayContaining(['k_test', 'c_far']));
    const big: Thing[] = [
      { k: 'lock', id: 'l_big', at: { x: 20, y: 10 }, w: 1, h: 1, big: true },
      chest('c_far', 30, 15),
    ];
    expect(solve(room(big), start(), nothing, LEVELS).opened).not.toContain('c_far');
    const key = start((s) => (dungeonOf(s, 'd1').bigKey = true));
    expect(solve(room(big), key, nothing, LEVELS).opened).toContain('c_far');
  });
});
