import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import { NEW_GAME } from '@content/start';
import { SCREEN_IDS } from '@content/world/screens';
import { applyPreset } from '@core/dev/query';
import { solve } from '@core/progress/solver';
import { SEASONS } from '@core/clock/types';
import { newGame, type GameState } from '@core/state/gameState';

const nothing = (): boolean => false;

/** Under the Fimbulvetr with Niflmýrr open (M6b), and the seal-skin won from Hrafn's nights or not. */
function afterHelgrind(skin: boolean): GameState {
  const s = newGame(1, NEW_GAME);
  applyPreset(s, DEV_PRESETS.haubow);
  Object.assign(s.flags, { st_pass_open: true, st_home_winter: true, st_rime_open: true });
  if (skin) s.inv.items.sealskin = 1;
  return s;
}

// Helgrind has proofs of its own (solver_d4): leaving it out keeps these solves from branching on its keys.
const within = SCREEN_IDS.filter((id) => DB.screens[id].dungeon !== 'd4');
const LAKE = SCREEN_IDS.filter((id) => id.startsWith('sae_') || id === 'ref_int_hall');
const SUNK = ['sae_c_landing', 'sae_c_open', 'sae_c_drowned', 'sae_c_wreck', 'sae_c_narrows'];
const UNDER_ICE = ['sae_c_landing', 'sae_c_open', 'sae_c_drowned', 'sae_c_wreck'];

describe('the progression solver on Sævatn (M7a)', () => {
  it.each(SEASONS)(
    '%s: with the seal-skin, swims to every lake screen, the Refuge, the ore and each sunk thing not under ice',
    (season) => {
      const r = solve(DB, afterHelgrind(true), nothing, { season, within });
      for (const id of LAKE) expect(r.screens, id).toContain(id);
      // In winter the ice lies over the open lake: only what sinks in water that never freezes is dived for.
      const under = season === 'winter' ? UNDER_ICE : [];
      const dived = SUNK.filter((id) => !under.includes(id));
      expect(r.opened).toEqual(expect.arrayContaining([...dived, 'sae_c_ore1', 'sae_c_ore2']));
      for (const id of under) expect(r.opened).not.toContain(id);
      expect(r.pieces.includes('hp_sae_skerries')).toBe(season !== 'winter');
      expect(r.scripts).toEqual(
        expect.arrayContaining(['shop_vala', 'shop_hreggvidr', 'war_table', 'hof_pray']),
      );
      expect(r.stranded).toEqual([]);
    },
    120_000,
  );

  it.each(SEASONS)(
    '%s: without it, never lands on Holmr nor dives for anything',
    (season) => {
      const r = solve(DB, afterHelgrind(false), nothing, { season, within });
      // Winter ice reaches the outer edge of Holmr's screen; the warm ring keeps the island and its hall.
      expect(r.screens).not.toContain('ref_int_hall');
      expect(r.scripts).not.toContain('war_table');
      for (const id of SUNK) expect(r.opened).not.toContain(id);
      expect(r.pieces).not.toContain('hp_sae_skerries');
      expect(r.stranded).toEqual([]);
    },
    120_000,
  );
});
