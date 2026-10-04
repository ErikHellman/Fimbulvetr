import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { NEW_GAME } from '@content/start';
import { solve } from '@core/progress/solver';
import type { ContentDb } from '@core/sim/db';
import { newGame, type GameState } from '@core/state/gameState';
import { TILE } from '@core/world/dims';
import type { Thing } from '@core/world/screen';

/**
 * test_a cut in two by a lake across rows 9–12, with a surge on row 10 and black water on row 12's west
 * half; a piece of heart beyond it, and a sunk chest and a sunk piece out in the water.
 */
function lake(things: Thing[]): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    if (y === 10) return '#' + '}'.repeat(38) + '#';
    if (y >= 9 && y <= 12) return '#' + '~'.repeat(38) + '#';
    return '#' + '.'.repeat(38) + '#';
  });
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

const far: Thing = { k: 'piece', id: 'hp_test_far', at: { x: 30, y: 18 } };
const sunkPiece: Thing = { k: 'piece', id: 'hp_test_sunk', at: { x: 20, y: 11 }, sunk: true };
const sunkChest: Thing = {
  k: 'chest',
  id: 'c_test_sunk',
  at: { x: 12, y: 9 },
  gives: { item: 'cheese' },
  sunk: true,
};
const shore: Thing = { k: 'piece', id: 'hp_test_shore', at: { x: 20, y: 8 } };

function start(skin: boolean): GameState {
  const s = newGame(1, NEW_GAME);
  s.hero.screen = 'test_a';
  s.hero.x = 19 * TILE + 8;
  s.hero.y = 4 * TILE + 14;
  if (skin) s.inv.items.sealskin = 1;
  return s;
}

const none = (): boolean => false;
const within = { within: ['test_a' as const] };

describe('the solver and swimming', () => {
  it('never crosses deep water without the seal-skin, nor dives for what lies in it', () => {
    const r = solve(lake([far, sunkPiece, sunkChest, shore]), start(false), none, within);
    expect(r.pieces).toEqual(['hp_test_shore']);
    expect(r.opened).not.toContain('c_test_sunk');
  });

  it('swims the lake, surge and all, and dives for the sunk chest and piece with it', () => {
    const r = solve(lake([far, sunkPiece, sunkChest, shore]), start(true), none, within);
    expect(r.pieces).toEqual(expect.arrayContaining(['hp_test_far', 'hp_test_sunk', 'hp_test_shore']));
    expect(r.opened).toContain('c_test_sunk');
  });

  it('cannot dive through winter ice, seal-skin or not', () => {
    for (const skin of [false, true]) {
      const r = solve(lake([sunkPiece, sunkChest]), start(skin), none, { ...within, season: 'winter' });
      expect(r.pieces, String(skin)).not.toContain('hp_test_sunk');
      expect(r.opened, String(skin)).not.toContain('c_test_sunk');
    }
  });
});
