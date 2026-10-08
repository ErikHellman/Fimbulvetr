import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { solve, type SolveOptions } from '@core/progress/solver';
import type { GameState } from '@core/state/gameState';
import { loadSave } from '@core/state/save';

vi.setConfig({ testTimeout: 120_000 });

const hrf = SCREEN_IDS.filter((id) => id.startsWith('hrf_'));
const WITHIN: SolveOptions = { within: [...hrf, 'dvg_ledges'], season: 'winter' };
const none = (): boolean => false;

/** Where M8b leaves Ask (its save fixture), walked up to Dvergagröf's ledges; `over` changes it. */
function atTheLedges(over: (s: GameState) => void = () => undefined): GameState {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m8b.json', import.meta.url), 'utf8'),
  );
  const loaded = loadSave(raw, new Set<string>(SCREEN_IDS));
  if (!loaded.ok) throw new Error(loaded.error.detail);
  const s = loaded.state;
  s.hero.screen = 'dvg_ledges';
  s.hero.x = 26 * 16 + 8;
  s.hero.y = 6 * 16 + 14;
  over(s);
  return s;
}

describe('Hrímfjöll (M9a)', () => {
  it('walks every screen in the ember byrnie, takes every chest and piece, and strands nothing', () => {
    const r = solve(DB, atTheLedges(), none, WITHIN);
    for (const id of hrf) expect(r.screens, id).toContain(id);
    expect(r.pieces).toContain('hp_hrf_glacier');
    expect(r.opened).toEqual(
      expect.arrayContaining(['hrf_c_icefall', 'hrf_c_ore', 'hrf_c_tarn', 'hrf_k_ore']),
    );
    expect(r.scripts).toContain('hrf_letter3');
    expect(r.stranded).toEqual([]);
  });

  it('is shut to Ask in a lesser byrnie: the killing frost turns Ask back', () => {
    const r = solve(
      DB,
      atTheLedges((s) => {
        s.inv.armor = 'byrnie';
      }),
      none,
      WITHIN,
    );
    expect(r.screens.filter((id) => id.startsWith('hrf_') && id !== 'hrf_int_hut')).toEqual([]);
  });

  it('needs the grapple for the crevasse, the only way to the icefall', () => {
    const r = solve(
      DB,
      atTheLedges((s) => {
        delete s.inv.items.grapple;
      }),
      none,
      WITHIN,
    );
    expect(r.screens).toContain('hrf_saddle');
    expect(r.opened).not.toContain('hrf_c_icefall');
  });
});
