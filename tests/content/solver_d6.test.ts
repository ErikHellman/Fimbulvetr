import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS, type ScreenId } from '@content/world/screens';
import { solve, type SolveOptions } from '@core/progress/solver';
import type { ContentDb } from '@core/sim/db';
import type { GameState } from '@core/state/gameState';
import { loadSave } from '@core/state/save';

vi.setConfig({ testTimeout: 300_000 });

const d6Rooms = SCREEN_IDS.filter((id) => DB.screens[id].dungeon === 'd6');
const WITHIN: SolveOptions = { within: [...d6Rooms, 'dvg_forgegate'], season: 'summer' };
const thane = (s: GameState): boolean => s.flags.st_thane_ivaldi === true;
const idsOf = (k: 'chest' | 'crack'): string[] =>
  d6Rooms.flatMap((id) => DB.screens[id].things.flatMap((t) => (t.k === k ? [t.id] : [])));

/** Where M8a leaves Ask (its save fixture), walked round to the forge gate; `over` changes it. */
function atTheGate(over: (s: GameState) => void = () => undefined): GameState {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m8a.json', import.meta.url), 'utf8'),
  );
  const loaded = loadSave(raw, new Set<string>(SCREEN_IDS));
  if (!loaded.ok) throw new Error(loaded.error.detail);
  const s = loaded.state;
  s.hero.screen = 'dvg_forgegate';
  s.hero.x = 19 * 16 + 8;
  s.hero.y = 9 * 16 + 14;
  over(s);
  return s;
}

/** The DB with one chest's gift turned into cheese: "cannot without X". */
function withoutChest(room: ScreenId, chest: string): ContentDb {
  const def = DB.screens[room];
  const things = def.things.map((t) =>
    t.k === 'chest' && t.id === chest
      ? { k: t.k, id: t.id, at: t.at, gives: { item: 'cheese' as const } }
      : t,
  );
  return { ...DB, screens: { ...DB.screens, [room]: { ...def, things } } };
}

describe('the progression solver on Ívaldi’s Forge', () => {
  const full = solve(DB, atTheGate(), thane, WITHIN);

  it('has twenty-eight rooms', () => {
    expect(d6Rooms).toHaveLength(28);
  });

  it('finishes the dungeon from the forge gate: Ívaldi falls', () => {
    expect(full.finishable).toBe(true);
  });

  it('reaches every room, chest, crack, the heart container and the piece of heart', () => {
    for (const id of d6Rooms) expect(full.screens, id).toContain(id);
    expect(idsOf('chest').length).toBeGreaterThanOrEqual(12);
    for (const id of [...idsOf('chest'), ...idsOf('crack'), 'd6_hc']) expect(full.opened, id).toContain(id);
    expect(full.pieces).toContain('hp_d6_r21');
    expect(full.scripts).toEqual(
      expect.arrayContaining(['d6_gate_out', 'd6_cell_thorkell', 'd6_cell_rannveig']),
    );
  });

  it('never soft-locks, whatever order the keys are spent in', () => {
    expect(full.branches).toBeGreaterThan(1);
    expect(full.softLocks).toEqual([]);
  });

  it('always lets Ask walk back out to the forge gate', () => {
    expect(full.stranded).toEqual([]);
  });

  it('cannot reach the great key nor be finished without the hammer', () => {
    const none = solve(withoutChest('d6_r15', 'd6_c_hammer'), atTheGate(), thane, WITHIN);
    expect(none.finishable).toBe(false);
    expect(none.opened).not.toContain('d6_c_bigkey');
  });

  it('cannot reach the stave of Skjálfti without Ís to crust the lava', () => {
    const r = solve(
      DB,
      atTheGate((s) => {
        s.inv.galdr = s.inv.galdr.filter((g) => g !== 'is');
        delete s.inv.items.stave_is;
      }),
      thane,
      WITHIN,
    );
    expect(r.opened).not.toContain('d6_c_skjalfti');
  });
});
