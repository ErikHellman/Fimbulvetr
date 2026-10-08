import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { NEW_GAME } from '@content/start';
import { solve } from '@core/progress/solver';
import type { ContentDb } from '@core/sim/db';
import { newGame, type GameState } from '@core/state/gameState';
import { TILE } from '@core/world/dims';
import type { Thing } from '@core/world/screen';

/**
 * test_a as a snowfield (under the killing frost or not) with a sheet of glaze over cols 10–30, rows 5–15,
 * and a rock on the ice at (20,10). (A piece out on open ice would be picked up mid-slide; the solver
 * only counts tiles Ask can stand on, so the open case is a nook off the ice.)
 */
function rink(things: Thing[], cold = false): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '▒'.repeat(40);
    const row = ['▒', ...Array.from({ length: 38 }, () => '∴'), '▒'];
    if (y >= 5 && y <= 15) for (let x = 10; x <= 30; x++) row[x] = '◇';
    if (y === 10) row[20] = '▒';
    // A nook off the ice at (25,4), entered only from (25,5), where no slide stops (a rock at (25,6)).
    if (y === 6) row[25] = '▒';
    if (y === 4) [row[24], row[26]] = ['▒', '▒'];
    if (y === 3) [row[24], row[25], row[26]] = ['▒', '▒', '▒'];
    return row.join('');
  });
  const screen = { ...DB.screens.test_a, map, things, ...(cold ? { cold: true as const } : {}) };
  return { ...DB, screens: { ...DB.screens, test_a: screen } };
}

function start(over: (s: GameState) => void = () => undefined): GameState {
  const s = newGame(1, NEW_GAME);
  s.hero.screen = 'test_a';
  s.hero.x = 4 * TILE + 8;
  s.hero.y = 2 * TILE + 14;
  over(s);
  return s;
}

const none = (): boolean => false;
const within = { within: ['test_a' as const] };

describe('the solver on Hrímfjöll', () => {
  it('stops on the ice only against something, never in the open', () => {
    const things: Thing[] = [
      { k: 'piece', id: 'hp_test_rock', at: { x: 19, y: 10 } },
      { k: 'piece', id: 'hp_test_open', at: { x: 25, y: 4 } },
    ];
    const r = solve(rink(things), start(), none, within);
    expect(r.pieces).toContain('hp_test_rock');
    expect(r.pieces).not.toContain('hp_test_open');
  });

  it('crosses the killing frost only in warm armour', () => {
    const things: Thing[] = [{ k: 'piece', id: 'hp_test_far', at: { x: 35, y: 18 } }];
    const cold = solve(rink(things, true), start(), none, within);
    expect(cold.pieces).not.toContain('hp_test_far');
    const warm = solve(
      rink(things, true),
      start((s) => {
        s.inv.armor = 'ember_byrnie';
      }),
      none,
      within,
    );
    expect(warm.pieces).toContain('hp_test_far');
  });
});
