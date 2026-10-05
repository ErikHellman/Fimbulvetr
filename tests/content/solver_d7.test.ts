import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS, type ScreenId } from '@content/world/screens';
import { solve, type SolveOptions } from '@core/progress/solver';
import type { ContentDb } from '@core/sim/db';
import type { GameState } from '@core/state/gameState';
import { loadSave } from '@core/state/save';

vi.setConfig({ testTimeout: 300_000 });

const d7Rooms = SCREEN_IDS.filter((id) => DB.screens[id].dungeon === 'd7');
const WITHIN: SolveOptions = { within: [...d7Rooms, 'hrf_towerfoot'], season: 'winter' };
const thane = (s: GameState): boolean => s.flags.st_thane_hrimgerdr === true;
const idsOf = (k: 'chest' | 'crack'): string[] =>
  d7Rooms.flatMap((id) => DB.screens[id].things.flatMap((t) => (t.k === k ? [t.id] : [])));

/** Where M9a leaves Ask (its save fixture), walked round to the tower's foot; `over` changes it. */
function atTheTower(over: (s: GameState) => void = () => undefined): GameState {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m9a.json', import.meta.url), 'utf8'),
  );
  const loaded = loadSave(raw, new Set<string>(SCREEN_IDS));
  if (!loaded.ok) throw new Error(loaded.error.detail);
  const s = loaded.state;
  s.hero.screen = 'hrf_towerfoot';
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

describe('the progression solver on Hrímturn', () => {
  const full = solve(DB, atTheTower(), thane, WITHIN);

  it('has thirty-two rooms', () => {
    expect(d7Rooms).toHaveLength(32);
  });

  it('finishes the dungeon from the tower’s foot: Hrímgerðr falls', () => {
    expect(full.finishable).toBe(true);
  });

  it('reaches every room, chest, crack, the heart container and the piece of heart', () => {
    for (const id of d7Rooms) expect(full.screens, id).toContain(id);
    expect(idsOf('chest').length).toBeGreaterThanOrEqual(12);
    for (const id of [...idsOf('chest'), ...idsOf('crack'), 'd7_hc']) expect(full.opened, id).toContain(id);
    expect(full.pieces).toContain('hp_d7_beam');
    expect(full.scripts).toEqual(expect.arrayContaining(['d7_gate_out', 'd7_cell_asa', 'd7_cell_bjarni']));
  });

  it('never soft-locks, whatever order the keys are spent in', () => {
    expect(full.branches).toBeGreaterThan(1);
    expect(full.softLocks).toEqual([]);
  });

  it('always lets Ask walk back out to the tower’s foot', () => {
    expect(full.stranded).toEqual([]);
  });

  it('cannot reach the great key nor be finished without the mirror', () => {
    const none = solve(withoutChest('d7_r23', 'd7_c_mirror'), atTheTower(), thane, WITHIN);
    expect(none.finishable).toBe(false);
    expect(none.opened).not.toContain('d7_c_bigkey');
  });

  it('passes the first light with the sword alone, before the mirror', () => {
    const r = solve(
      withoutChest('d7_r23', 'd7_c_mirror'),
      atTheTower(),
      (s) => s.flags.st_d7_eye_r30 === true,
      WITHIN,
    );
    expect(r.finishable).toBe(true);
  });
});
