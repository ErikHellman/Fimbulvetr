import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { NEW_GAME } from '@content/start';
import { solve } from '@core/progress/solver';
import type { ContentDb } from '@core/sim/db';
import { newGame, type GameState } from '@core/state/gameState';
import { TILE } from '@core/world/dims';
import type { Thing } from '@core/world/screen';

/**
 * test_a cut in two by a chasm of water across rows 9–12; a bridge over it that a fan lowers, or a sailing
 * raft across it; and a piece beyond.
 */
function room(things: Thing[]): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    if (y >= 9 && y <= 12) return '#' + '~'.repeat(38) + '#';
    return '#' + '.'.repeat(38) + '#';
  });
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

const far: Thing = { k: 'piece', id: 'hp_test_far', at: { x: 30, y: 18 } };
const fan: Thing = { k: 'switch', at: { x: 10, y: 3 }, set: 'w_myl_bridge', fan: true };
const bridge: Thing = {
  k: 'bridge',
  at: { x: 20, y: 9 },
  w: 2,
  h: 4,
  down: { k: 'flag', id: 'w_myl_bridge' },
};
const sail: Thing = { k: 'raft', at: { x: 20, y: 7 }, path: [{ x: 20, y: 13 }], sail: true };

function start(vindr: boolean): GameState {
  const s = newGame(1, NEW_GAME);
  s.hero.screen = 'test_a';
  s.hero.x = 19 * TILE + 8;
  s.hero.y = 4 * TILE + 14;
  if (vindr) s.inv.galdr = ['vindr'];
  return s;
}

const none = (): boolean => false;
const within = { within: ['test_a' as const] };

describe('the solver and Vindr', () => {
  it('spins a wind fan only with Vindr, from up to five tiles off in a straight line', () => {
    expect(solve(room([fan, bridge, far]), start(false), none, within).pieces).not.toContain('hp_test_far');
    expect(solve(room([fan, bridge, far]), start(true), none, within).pieces).toContain('hp_test_far');
  });

  it('sails a raft only with Vindr', () => {
    expect(solve(room([sail, far]), start(false), none, within).pieces).not.toContain('hp_test_far');
    expect(solve(room([sail, far]), start(true), none, within).pieces).toContain('hp_test_far');
  });
});
