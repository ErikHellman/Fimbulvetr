import { describe, expect, it } from 'vitest';
import { SCREENS } from '@content/world/registry';
import { SCREEN_IDS } from '@content/world/screens';

/**
 * Every id a save can hold for a thing on a screen: heart pieces (`world.pieces`), chests and heart
 * containers (`world.opened`), locks and saved shutters (a dungeon's `doors`), herbs (`world.vars`). Append only: renaming or
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
] as const;

function contentIds(): Set<string> {
  const out = new Set<string>();
  for (const id of SCREEN_IDS)
    for (const t of SCREENS[id].things) {
      if (t.k === 'piece' || t.k === 'chest' || t.k === 'heart' || t.k === 'lock' || t.k === 'herb')
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
