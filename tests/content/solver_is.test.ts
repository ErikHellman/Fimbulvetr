import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { NEW_GAME } from '@content/start';
import { solve } from '@core/progress/solver';
import type { ContentDb } from '@core/sim/db';
import { newGame, type GameState } from '@core/state/gameState';
import { TILE } from '@core/world/dims';
import type { Thing } from '@core/world/screen';

/** test_a as a crypt room cut in two by a band of still water across rows 9–12, and a piece beyond it. */
function room(things: Thing[]): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '8'.repeat(40);
    if (y >= 9 && y <= 12) return '8' + '~'.repeat(38) + '8';
    return '8' + '7'.repeat(38) + '8';
  });
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

const piece: Thing = { k: 'piece', id: 'hp_test_far', at: { x: 30, y: 18 } };

function start(): GameState {
  const s = newGame(1, NEW_GAME);
  s.hero.screen = 'test_a';
  s.hero.x = 19 * TILE + 8;
  s.hero.y = 4 * TILE + 14;
  return s;
}

const none = (): boolean => false;
const within = { within: ['test_a' as const] };

describe('the solver and Ís', () => {
  it('crosses still water once a chest has taught Ís', () => {
    expect(solve(room([piece]), start(), none, within).pieces).not.toContain('hp_test_far');
    const lesson: Thing = {
      k: 'chest',
      id: 'c_is',
      at: { x: 10, y: 4 },
      gives: { item: 'cheese' },
      learn: 'is',
      text: { en: 'Ís!', sv: 'Ís!' },
    };
    expect(solve(room([lesson, piece]), start(), none, within).pieces).toContain('hp_test_far');
  });

  it('takes rune-staves from a pedestal script, and only while none are held', () => {
    const pedestal: Thing = {
      k: 'use',
      at: { x: 10, y: 4 },
      script: 'd4_pedestal',
      when: { k: 'not', c: { k: 'item', id: 'stave_is', gte: 1 } },
    };
    const r = solve(room([pedestal, piece]), start(), none, within);
    expect(r.scripts).toContain('d4_pedestal');
    expect(r.pieces).toContain('hp_test_far');
  });
});
