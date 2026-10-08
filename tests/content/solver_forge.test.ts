import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { NEW_GAME } from '@content/start';
import { solve } from '@core/progress/solver';
import type { ContentDb } from '@core/sim/db';
import { newGame, type GameState } from '@core/state/gameState';
import { TILE } from '@core/world/dims';
import type { Thing } from '@core/world/screen';

/** test_a as a forge room cut in two by a lava band (rows 9–12), with belts on the near side, and a piece beyond. */
function room(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '▓'.repeat(40);
    if (y >= 9 && y <= 12) return '▓' + '≈'.repeat(38) + '▓';
    if (y === 5) return '▓' + '→'.repeat(38) + '▓';
    return '▓' + '░'.repeat(38) + '▓';
  });
  const things: Thing[] = [{ k: 'piece', id: 'hp_test_far', at: { x: 30, y: 18 } }];
  const screen = { ...DB.screens.test_a, map, things, hot: true as const };
  return { ...DB, screens: { ...DB.screens, test_a: screen } };
}

function start(over: (s: GameState) => void = () => undefined): GameState {
  const s = newGame(1, NEW_GAME);
  s.hero.screen = 'test_a';
  s.hero.x = 19 * TILE + 8;
  s.hero.y = 4 * TILE + 14;
  over(s);
  return s;
}

const none = (): boolean => false;
const within = { within: ['test_a' as const] };

describe('the solver in a forge', () => {
  it('walks belts and hot rooms as floor, but not lava', () => {
    const r = solve(room(), start(), none, within);
    expect(r.pieces).not.toContain('hp_test_far');
  });

  it('crosses lava once Ask can sing Ís', () => {
    const r = solve(
      room(),
      start((s) => {
        s.inv.galdr = ['is'];
      }),
      none,
      within,
    );
    expect(r.pieces).toContain('hp_test_far');
  });
});
