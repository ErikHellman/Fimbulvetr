import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS, type ScreenId } from '@content/world/screens';
import { solve, type SolveOptions } from '@core/progress/solver';
import type { ContentDb } from '@core/sim/db';
import type { GameState } from '@core/state/gameState';
import { loadSave } from '@core/state/save';

vi.setConfig({ testTimeout: 300_000 });

const d5Rooms = SCREEN_IDS.filter((id) => DB.screens[id].dungeon === 'd5');
const WITHIN: SolveOptions = { within: [...d5Rooms, 'sae_drowned'], levels: true, season: 'summer' };
const thane = (s: GameState): boolean => s.flags.st_thane_nykr === true;
const idsOf = (k: 'chest' | 'crack'): string[] =>
  d5Rooms.flatMap((id) => DB.screens[id].things.flatMap((t) => (t.k === k ? [t.id] : [])));

/** Where M7a leaves Ask (its save fixture), swimming by the spire in the drowned village; `over` changes it. */
function atTheSpire(over: (s: GameState) => void = () => undefined): GameState {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m7a.json', import.meta.url), 'utf8'),
  );
  const loaded = loadSave(raw, new Set<string>(SCREEN_IDS));
  if (!loaded.ok) throw new Error(loaded.error.detail);
  const s = loaded.state;
  s.hero.screen = 'sae_drowned';
  s.hero.x = 16 * 16 + 8;
  s.hero.y = 10 * 16 + 14;
  over(s);
  return s;
}

/** The DB with one chest's gift turned into cheese, and no galdr taught: "cannot without X". */
function withoutChest(room: ScreenId, chest: string): ContentDb {
  const def = DB.screens[room];
  const things = def.things.map((t) =>
    t.k === 'chest' && t.id === chest
      ? { k: t.k, id: t.id, at: t.at, gives: { item: 'cheese' as const } }
      : t,
  );
  return { ...DB, screens: { ...DB.screens, [room]: { ...def, things } } };
}

describe('the progression solver on Sökkva Hof', () => {
  const full = solve(DB, atTheSpire(), thane, WITHIN);

  it('has twenty-four rooms', () => {
    expect(d5Rooms).toHaveLength(24);
  });

  it('finishes the dungeon from the spire: Nykr falls', () => {
    expect(full.finishable).toBe(true);
  });

  it('reaches every room, chest, the crack, the heart container and the piece of heart', () => {
    for (const id of d5Rooms) expect(full.screens, id).toContain(id);
    expect(idsOf('chest').length).toBeGreaterThanOrEqual(10);
    for (const id of [...idsOf('chest'), ...idsOf('crack'), 'd5_hc']) expect(full.opened, id).toContain(id);
    expect(full.pieces).toContain('hp_d5_r17');
    expect(full.scripts).toEqual(expect.arrayContaining(['d5_gate_out', 'd5_cell_oddr', 'd5_cell_hallbera']));
  });

  it('never soft-locks, whatever order the keys are spent in', () => {
    expect(full.branches).toBeGreaterThan(1);
    expect(full.softLocks).toEqual([]);
  });

  it('always lets Ask swim back to the spire', () => {
    expect(full.stranded).toEqual([]);
  });

  it('cannot reach the great key nor be finished without Vindr', () => {
    const none = solve(withoutChest('d5_r16', 'd5_c_vindr'), atTheSpire(), thane, WITHIN);
    expect(none.finishable).toBe(false);
    expect(none.opened).not.toContain('d5_c_bigkey');
  });

  it('cannot get in without the seal-skin', () => {
    const r = solve(
      DB,
      atTheSpire((s) => {
        delete s.inv.items.sealskin;
        s.hero.x = 16 * 16 + 8;
      }),
      thane,
      WITHIN,
    );
    expect(r.screens).not.toContain('d5_r01');
  });
});
