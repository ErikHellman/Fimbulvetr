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

const d2Rooms = SCREEN_IDS.filter((id) => DB.screens[id].dungeon === 'd2');
const WITHIN: SolveOptions = { within: [...d2Rooms, 'myl_mill'], levels: true };
const lit = (s: GameState): boolean => s.flags.st_stone2_lit === true;
const idsOf = (k: 'chest' | 'crack'): string[] =>
  d2Rooms.flatMap((id) => DB.screens[id].things.flatMap((t) => (t.k === k ? [t.id] : [])));

function atTheDoor(over: (s: GameState) => void = () => undefined): GameState {
  const s = newGame(1, NEW_GAME);
  applyPreset(s, DEV_PRESETS.d2);
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

describe('the progression solver on Sökkva Kvern, over every water level', () => {
  const full = solve(DB, atTheDoor(), lit, WITHIN);

  it('finishes the dungeon from its door: the second stone can be lit', () => {
    expect(full.finishable).toBe(true);
    expect(full.scripts).toContain('stone2_light');
  });

  it('reaches every chest, crack, the heart container and the piece of heart', () => {
    expect(idsOf('chest').length).toBeGreaterThanOrEqual(8);
    for (const id of [...idsOf('chest'), ...idsOf('crack'), 'd2_hc']) expect(full.opened, id).toContain(id);
    expect(full.pieces).toContain('hp_d2_r13');
  });

  it('never soft-locks, whatever order the keys are spent in', () => {
    expect(full.branches).toBeGreaterThan(1);
    expect(full.softLocks).toEqual([]);
  });

  it('always lets Ask walk back to the door, at any water level', () => {
    expect(full.stranded).toEqual([]);
  });

  it('cannot be finished without bombs', () => {
    const none = solve(withoutChest('d2_r07', 'd2_c_bombs'), atTheDoor(), lit, WITHIN);
    expect(none.finishable).toBe(false);
    expect(none.opened).not.toContain('d2_c_key3');
  });

  it('cannot be finished without the boomerang', () => {
    const bare = atTheDoor((s) => {
      delete s.inv.items.boomerang;
      s.inv.slots = ['lantern', null];
    });
    const none = solve(DB, bare, lit, WITHIN);
    expect(none.finishable).toBe(false);
    expect(none.opened).not.toContain('d2_c_key1');
  });
});
