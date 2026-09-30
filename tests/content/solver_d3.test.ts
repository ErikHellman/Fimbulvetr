import { describe, expect, it, vi } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import { NEW_GAME } from '@content/start';
import { SCREEN_IDS, type ScreenId } from '@content/world/screens';
import { applyPreset } from '@core/dev/query';
import { solve, type SolveOptions } from '@core/progress/solver';
import type { ContentDb } from '@core/sim/db';
import { newGame, type GameState } from '@core/state/gameState';

vi.setConfig({ testTimeout: 60_000 });

const d3Rooms = SCREEN_IDS.filter((id) => DB.screens[id].dungeon === 'd3');
const WITHIN: SolveOptions = { within: [...d3Rooms, 'hau_king'] };
const lit = (s: GameState): boolean => s.flags.st_stone3_lit === true;
const idsOf = (k: 'chest' | 'crack'): string[] =>
  d3Rooms.flatMap((id) => DB.screens[id].things.flatMap((t) => (t.k === k ? [t.id] : [])));

function atTheDoor(over: (s: GameState) => void = () => undefined): GameState {
  const s = newGame(1, NEW_GAME);
  applyPreset(s, DEV_PRESETS.d3);
  over(s);
  return s;
}

/** The DB with one chest's gift turned into cheese: "cannot without X" removes X at its source. */
function withoutChest(room: ScreenId, chest: string): ContentDb {
  const def = DB.screens[room];
  const things = def.things.map((t) =>
    t.k === 'chest' && t.id === chest ? { ...t, gives: { item: 'cheese' as const } } : t,
  );
  return { ...DB, screens: { ...DB.screens, [room]: { ...def, things } } };
}

describe('the progression solver on Konungshaugr', () => {
  const full = solve(DB, atTheDoor(), lit, WITHIN);

  it('has twenty rooms', () => {
    expect(d3Rooms).toHaveLength(20);
  });

  it('finishes the dungeon from its door: the third stone can be lit', () => {
    expect(full.finishable).toBe(true);
    expect(full.scripts).toContain('stone3_light');
  });

  it('reaches every room, chest, the crack, the heart container and the piece of heart', () => {
    for (const id of d3Rooms) expect(full.screens, id).toContain(id);
    expect(idsOf('chest').length).toBeGreaterThanOrEqual(9);
    for (const id of [...idsOf('chest'), ...idsOf('crack'), 'd3_hc']) expect(full.opened, id).toContain(id);
    expect(full.pieces).toContain('hp_d3_r15');
  });

  it('never soft-locks, whatever order the keys are spent in', () => {
    expect(full.branches).toBeGreaterThan(1);
    expect(full.softLocks).toEqual([]);
  });

  it('always lets Ask walk back to the door', () => {
    expect(full.stranded).toEqual([]);
  });

  it('cannot be finished without the bow, nor the third key reached', () => {
    const none = solve(withoutChest('d3_r09', 'd3_c_bow'), atTheDoor(), lit, WITHIN);
    expect(none.finishable).toBe(false);
    expect(none.opened).not.toContain('d3_c_key3');
    expect(none.opened).not.toContain('d3_c_compass');
  });

  it('is shut behind the barrow door until the watch is kept', () => {
    const shut = atTheDoor((s) => {
      s.flags.st_barrow_open = false;
      s.hero.screen = 'hau_king';
      s.hero.x = 20 * 16 + 8;
      s.hero.y = 16 * 16 + 14;
    });
    expect(solve(DB, shut, lit, WITHIN).screens).not.toContain('d3_r01');
  });
});
