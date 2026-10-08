import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { SEASONS } from '@core/clock/types';
import { solve } from '@core/progress/solver';
import { loadSave } from '@core/state/save';
import type { GameState } from '@core/state/gameState';
import { TILE } from '@core/world/dims';

const nothing = (): boolean => false;

/** Where M7b leaves Ask (its save fixture), set down on Haugar's tarn; `over` changes it. */
function atTheTarn(over: (s: GameState) => void = () => undefined): GameState {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m7b.json', import.meta.url), 'utf8'),
  );
  const loaded = loadSave(raw, new Set<string>(SCREEN_IDS));
  if (!loaded.ok) throw new Error(loaded.error.detail);
  const s = loaded.state;
  s.hero.screen = 'hau_tarn';
  s.hero.x = 34 * TILE + 8;
  s.hero.y = 10 * TILE + 14;
  over(s);
  return s;
}

// The dungeons have proofs of their own: leaving them out keeps these solves from branching on their keys.
const within = SCREEN_IDS.filter((id) => DB.screens[id].dungeon === undefined);
const DVG = SCREEN_IDS.filter((id) => id.startsWith('dvg_'));

describe('the progression solver on Dvergagröf (M8a)', () => {
  it.each(SEASONS)(
    '%s: over the chasm with the grapple to every screen, the ore and the vents chest',
    (season) => {
      const r = solve(DB, atTheTarn(), nothing, { season, within });
      for (const id of DVG) expect(r.screens, id).toContain(id);
      expect(r.opened).toEqual(
        expect.arrayContaining([
          'dvg_k_ore1',
          'dvg_c_ore1',
          'dvg_k_ore2',
          'dvg_c_ore2',
          'dvg_k_ore3',
          'dvg_c_ore3',
          'dvg_k_cavein',
          'dvg_c_vents',
          'dvg_c_peak',
        ]),
      );
      expect(r.stranded).toEqual([]);
    },
    120_000,
  );

  it('never crosses the chasm without the grapple', () => {
    const r = solve(
      DB,
      atTheTarn((s) => {
        delete s.inv.items.grapple;
      }),
      nothing,
      { season: 'summer', within },
    );
    // The near lip is on the chasm's own screen, and the cart road's Uppvík end is behind Ketill's forge
    // (boarded halfway); everything past the drop is out of reach.
    for (const id of DVG.filter((d) => d !== 'dvg_chasm' && d !== 'dvg_int_tunnel'))
      expect(r.screens).not.toContain(id);
  }, 120_000);

  it('walks the cart road from Uppvík once Dvalinn has opened it, grapple or not', () => {
    const r = solve(
      DB,
      atTheTarn((s) => {
        delete s.inv.items.grapple;
        s.flags.q_foreman = 5;
      }),
      nothing,
      { season: 'summer', within },
    );
    expect(r.screens).toEqual(expect.arrayContaining(['dvg_int_tunnel', 'dvg_minehead', 'dvg_camp']));
  }, 120_000);

  it('reaches the old workings and the lamp-room once the cave-in is blown', () => {
    const r = solve(DB, atTheTarn(), nothing, { season: 'winter', within });
    expect(r.screens).toEqual(expect.arrayContaining(['dvg_int_mine1', 'dvg_int_mine2']));
  }, 120_000);
});
