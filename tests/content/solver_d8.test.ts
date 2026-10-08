import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { solve, type SolveOptions } from '@core/progress/solver';
import type { GameState } from '@core/state/gameState';
import { loadSave } from '@core/state/save';

vi.setConfig({ testTimeout: 300_000 });

const d8Rooms = SCREEN_IDS.filter((id) => DB.screens[id].dungeon === 'd8');
const WITHIN: SolveOptions = { within: [...d8Rooms, 'hrf_utgard'], season: 'winter' };
const beaten = (s: GameState): boolean => s.flags.st_kolbeinn_beaten === true;
const idsOf = (k: 'chest' | 'crack'): string[] =>
  d8Rooms.flatMap((id) => DB.screens[id].things.flatMap((t) => (t.k === k ? [t.id] : [])));

/** Where M9b leaves Ask (its save fixture), walked up to Útgarðr's gate after Halvar opened it. */
function atTheGate(over: (s: GameState) => void = () => undefined): GameState {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m9b.json', import.meta.url), 'utf8'),
  );
  const loaded = loadSave(raw, new Set<string>(SCREEN_IDS));
  if (!loaded.ok) throw new Error(loaded.error.detail);
  const s = loaded.state;
  s.flags.st_halvar_confessed = true;
  s.flags.st_utgard_open = true;
  s.hero.screen = 'hrf_utgard';
  s.hero.x = 20 * 16 + 8;
  s.hero.y = 9 * 16 + 14;
  over(s);
  return s;
}

describe('the progression solver on Útgarðr', () => {
  const full = solve(DB, atTheGate(), beaten, WITHIN);

  it('finishes the stronghold from the gate: Kolbeinn is beaten', () => {
    expect(full.finishable).toBe(true);
  });

  it('reaches every room, chest, crack and the piece of heart', () => {
    for (const id of d8Rooms) expect(full.screens, id).toContain(id);
    expect(idsOf('chest').length).toBeGreaterThanOrEqual(10);
    for (const id of [...idsOf('chest'), ...idsOf('crack')]) expect(full.opened, id).toContain(id);
    expect(full.pieces).toContain('hp_d8_keep');
  });

  it('never soft-locks, whatever order the keys are spent in', () => {
    expect(full.branches).toBeGreaterThan(1);
    expect(full.softLocks).toEqual([]);
  });

  it('always lets Ask walk back out to the gate', () => {
    expect(full.stranded).toEqual([]);
  });

  it('keeps the master key behind all three seals', () => {
    const r = solve(
      DB,
      atTheGate((s) => (s.inv.galdr = s.inv.galdr.filter((g) => g !== 'vindr'))),
      beaten,
      WITHIN,
    );
    expect(r.finishable).toBe(false);
    expect(r.opened).not.toContain('d8_c_bigkey');
  });

  it('needs the mirror for the high seal', () => {
    const r = solve(
      DB,
      atTheGate((s) => delete s.inv.items.mirror),
      beaten,
      WITHIN,
    );
    expect(r.finishable).toBe(false);
    expect(r.opened).not.toContain('d8_c_bigkey');
  });

  it('keeps the gate in the ice shut until Halvar has spoken', () => {
    const r = solve(
      DB,
      atTheGate((s) => (s.flags.st_utgard_open = false)),
      beaten,
      WITHIN,
    );
    expect(r.screens).not.toContain('d8_r36');
  });
});
