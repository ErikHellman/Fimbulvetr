import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREENS } from '@content/world/registry';
import { SCREEN_IDS } from '@content/world/screens';

/**
 * Every id a save can hold for a thing on a screen: heart pieces (`world.pieces`), chests and heart
 * containers and cracks (`world.opened`), locks and saved shutters (a dungeon's `doors`), herbs (`world.vars`). Append only: renaming or
 * removing one strands old saves unless a migration moves it (CLAUDE.md, "Persisted ids").
 */
const PERSISTED = [
  // M1a
  'hp_ask_ridge',
  // M1b
  'hp_myr_pines',
  'hp_myr_brook',
  // M1c — Rótarhellir
  'd1_c_r02',
  'd1_c_key1',
  'd1_c_key2',
  'd1_c_map',
  'd1_c_boomerang',
  'd1_c_compass',
  'd1_c_cache',
  'hp_d1_r09',
  'd1_hc',
  'd1_lock_a',
  'd1_lock_b',
  'd1_sh_r04',
  'd1_sh_r05',
  'd1_sh_r07',
  'd1_sh_r10',
  'd1_sh_boss',
  // M2c
  'hp_myr_fen',
  'hp_myr_trollskog',
  'herb_fen_1',
  'herb_fen_2',
  'herb_fen_3',
  // M3a — Mýrland (the fisher's piece is handed over by Kári, not found)
  'hp_myl_reeds',
  'hp_myl_fisher',
  // M3b — Sökkva Kvern (cracks are saved in world.opened like chests)
  'd2_c_key1',
  'd2_c_key2',
  'd2_c_key3',
  'd2_c_map',
  'd2_c_compass',
  'd2_c_bombs',
  'd2_c_bigkey',
  'd2_c_cache',
  'hp_d2_r13',
  'd2_hc',
  'd2_lock_a',
  'd2_lock_b',
  'd2_lock_c',
  'd2_lock_big',
  'd2_sh_r07',
  'd2_sh_r07w',
  'd2_sh_r16',
  'd2_k_r04',
  'd2_k_r07',
  'd2_k_r13',
  'd2_k_r14',
  'myl_k_springs',
  'myl_k_peat',
  'myl_c_bombbag',
  'hp_myl_peat',
  'hau_k_gully',
  'hau_k_barrows',
  'hp_hau_barrows',
  'hp_hau_tarn',
  'd3_c_map',
  'd3_c_compass',
  'd3_c_key1',
  'd3_c_key2',
  'd3_c_key3',
  'd3_c_bow',
  'd3_c_bigkey',
  'd3_c_silver',
  'd3_c_cache',
  'hp_d3_r15',
  'd3_hc',
  'd3_lock_a',
  'd3_lock_b',
  'd3_lock_c',
  'd3_lock_big',
  'd3_sh_r02',
  'd3_sh_r09w',
  'd3_sh_r09e',
  'd3_sh_r20',
  'd3_k_r18',
] as const;

/** Pieces of heart handed over by effects in dialogue and scripts (`{k:'piece', id}`). */
function givenPieces(root: unknown, out: Set<string>): void {
  if (root === null || typeof root !== 'object') return;
  const o = root as Record<string, unknown>;
  if (o['k'] === 'piece' && typeof o['id'] === 'string' && !('at' in o)) out.add(o['id']);
  for (const v of Object.values(o)) givenPieces(v, out);
}

function contentIds(): Set<string> {
  const out = new Set<string>();
  givenPieces(DB.dialogue, out);
  givenPieces(DB.scripts, out);
  for (const id of SCREEN_IDS)
    for (const t of SCREENS[id].things) {
      if (
        t.k === 'piece' ||
        t.k === 'chest' ||
        t.k === 'heart' ||
        t.k === 'lock' ||
        t.k === 'herb' ||
        t.k === 'crack'
      )
        out.add(t.id);
      if (t.k === 'shutter' && t.id !== undefined) out.add(t.id);
    }
  return out;
}

describe('persisted ids', () => {
  it('are all recorded, so a new one cannot slip in unnoticed', () => {
    const recorded = new Set<string>(PERSISTED);
    for (const id of contentIds()) expect(recorded.has(id), `${id} is not in PERSISTED`).toBe(true);
  });

  it('are never renamed or removed', () => {
    const live = contentIds();
    for (const id of PERSISTED) expect(live.has(id), `${id} was removed or renamed`).toBe(true);
  });

  it('are unique in the list', () => {
    expect(new Set(PERSISTED).size).toBe(PERSISTED.length);
  });
});
