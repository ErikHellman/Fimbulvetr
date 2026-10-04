import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS, type ScreenId } from '@content/world/screens';
import { solve, type SolveOptions } from '@core/progress/solver';
import type { ContentDb } from '@core/sim/db';
import type { GameState } from '@core/state/gameState';
import { loadSave } from '@core/state/save';

vi.setConfig({ testTimeout: 120_000 });

const d4Rooms = SCREEN_IDS.filter((id) => DB.screens[id].dungeon === 'd4');
const WITHIN: SolveOptions = { within: [...d4Rooms, 'nif_gate'] };
const thane = (s: GameState): boolean => s.flags.st_thane_nastrond === true;
const idsOf = (k: 'chest' | 'crack'): string[] =>
  d4Rooms.flatMap((id) => DB.screens[id].things.flatMap((t) => (t.k === k ? [t.id] : [])));

/** Where M6a leaves Ask (its save fixture), stood before Helgrind's gate; `over` changes it. */
function atTheGate(over: (s: GameState) => void = () => undefined): GameState {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m6a.json', import.meta.url), 'utf8'),
  );
  const loaded = loadSave(raw, new Set<string>(SCREEN_IDS));
  if (!loaded.ok) throw new Error(loaded.error.detail);
  const s = loaded.state;
  s.hero.screen = 'nif_gate';
  s.hero.x = 20 * 16 + 8;
  s.hero.y = 7 * 16 + 14;
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

describe('the progression solver on Helgrind', () => {
  const full = solve(DB, atTheGate(), thane, WITHIN);

  it('has twenty-two rooms', () => {
    expect(d4Rooms).toHaveLength(22);
  });

  it('finishes the dungeon from its gate: Náströnd falls', () => {
    expect(full.finishable).toBe(true);
  });

  it('reaches every room, chest, the crack, the heart container and the piece of heart', () => {
    for (const id of d4Rooms) expect(full.screens, id).toContain(id);
    expect(idsOf('chest').length).toBeGreaterThanOrEqual(13);
    for (const id of [...idsOf('chest'), ...idsOf('crack'), 'd4_hc']) expect(full.opened, id).toContain(id);
    expect(full.pieces).toContain('hp_d4_r14');
    expect(full.scripts).toEqual(expect.arrayContaining(['d4_gate_out', 'd4_cell_ulf', 'd4_cell_tofa']));
  });

  it('never soft-locks, whatever order the keys are spent in', () => {
    expect(full.branches).toBeGreaterThan(1);
    expect(full.softLocks).toEqual([]);
  });

  it('always lets Ask walk back to the gate', () => {
    expect(full.stranded).toEqual([]);
  });

  it('cannot be finished without the grapple, nor the third key or the great key reached', () => {
    const none = solve(withoutChest('d4_r07', 'd4_c_grapple'), atTheGate(), thane, WITHIN);
    expect(none.finishable).toBe(false);
    expect(none.opened).not.toContain('d4_c_key3');
    expect(none.opened).not.toContain('d4_c_bigkey');
  });

  it('crosses the stave pool with no staves in hand: the rack gives them', () => {
    const empty = atTheGate((s) => {
      delete s.inv.items.stave_is;
      s.inv.slots = [null, s.inv.slots[1] ?? null];
    });
    const r = solve(DB, empty, thane, WITHIN);
    expect(r.finishable).toBe(true);
    expect(r.scripts).toContain('d4_pedestal');
    expect(r.screens).toContain('d4_r05');
  });
});
