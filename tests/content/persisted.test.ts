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
  'hau_c_quiver',
  'hp_hau_watch',
  // M5b (pieces handed over by quests; pen keys in world.vars: hau_hurdles)
  'hp_hau_heath',
  'ask_c_leaf',
  'myr_c_leaf',
  'myl_c_leaf',
  'hau_c_leaf',
  'hp_ask_village',
  'hp_upp_range',
  'hp_upp_bay',
  'nif_k_jars',
  'hp_nif_cairns',
  'hp_nif_deadwood',
  'nif_c_cave',
  // M6b — Helgrind
  'd4_c_key1',
  'd4_c_key2',
  'd4_c_key3',
  'd4_c_map',
  'd4_c_compass',
  'd4_c_grapple',
  'd4_c_is',
  'd4_c_bigkey',
  'd4_c_r05',
  'd4_c_r11',
  'd4_c_r12',
  'd4_c_r16',
  'd4_c_cache',
  'hp_d4_r14',
  'd4_hc',
  'd4_k_r20',
  'd4_lock_a',
  'd4_lock_b',
  'd4_lock_c',
  'd4_lock_big',
  'd4_sh_r07n',
  'd4_sh_r07e',
  'd4_sh_r22',
  // M7a — Sævatn
  'sae_c_landing',
  'sae_c_open',
  'hp_sae_skerries',
  'sae_c_drowned',
  'sae_c_wreck',
  'sae_c_narrows',
  'sae_k_ore1',
  'sae_c_ore1',
  'sae_k_ore2',
  'sae_c_ore2',
  // M7b — Sökkva Hof
  'd5_c_key1',
  'd5_c_key2',
  'd5_c_key3',
  'd5_c_map',
  'd5_c_compass',
  'd5_c_vindr',
  'd5_c_bigkey',
  'd5_c_cache',
  'd5_c_r05',
  'd5_c_r10',
  'hp_d5_r17',
  'd5_hc',
  'd5_k_r23',
  'd5_lock_a',
  'd5_lock_b',
  'd5_lock_c',
  'd5_lock_big',
  'd5_sh_r11n',
  'd5_sh_r20',
  'myr_c_thread',
  'myl_c_thread',
  'hau_c_thread',
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
