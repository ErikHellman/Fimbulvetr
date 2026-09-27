import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import { NEW_GAME } from '@content/start';
import { SCREEN_IDS } from '@content/world/screens';
import { applyPreset } from '@core/dev/query';
import { solve } from '@core/progress/solver';
import type { ContentDb } from '@core/sim/db';
import { newGame, type GameState } from '@core/state/gameState';

const d1Rooms = SCREEN_IDS.filter((id) => DB.screens[id].dungeon === 'd1');
const d1Chests = d1Rooms.flatMap((id) =>
  DB.screens[id].things.flatMap((t) => (t.k === 'chest' ? [t.id] : [])),
);
const lit = (s: GameState): boolean => s.flags.st_stone1_lit === true;

function atTheMouth(lantern = true): GameState {
  const s = newGame(1, NEW_GAME);
  applyPreset(s, DEV_PRESETS.d1);
  if (!lantern) {
    s.inv.items = {};
    s.inv.slots = [null, null];
  }
  return s;
}

describe('the progression solver on Rótarhellir', () => {
  const full = solve(DB, atTheMouth(), lit);

  it('finishes the dungeon from its mouth: the stone can be lit', () => {
    expect(full.finishable).toBe(true);
    expect(full.scripts).toContain('stone1_light');
  });

  it('reaches every chest, the heart container and the piece of heart', () => {
    expect(d1Chests.length).toBeGreaterThanOrEqual(7);
    for (const id of [...d1Chests, 'd1_hc']) expect(full.opened, id).toContain(id);
    expect(full.pieces).toContain('hp_d1_r09');
  });

  it('never soft-locks, whatever order the keys are spent in', () => {
    expect(full.branches).toBeGreaterThan(1);
    expect(full.softLocks).toEqual([]);
  });

  it('always lets Ask walk back to the entrance', () => {
    expect(full.stranded).toEqual([]);
  });

  it('does not need the lantern (only the cache in the dark room does)', () => {
    const dark = solve(DB, atTheMouth(false), lit);
    expect(dark.finishable).toBe(true);
    expect(dark.opened).not.toContain('d1_c_cache');
    expect(dark.softLocks).toEqual([]);
  });

  it('cannot reach the boss without the boomerang', () => {
    const r07 = DB.screens.d1_r07;
    const things = r07.things.map((t) =>
      t.k === 'chest' && t.id === 'd1_c_boomerang' ? { ...t, gives: { item: 'cheese' as const } } : t,
    );
    const db: ContentDb = { ...DB, screens: { ...DB.screens, d1_r07: { ...r07, things } } };
    const none = solve(db, atTheMouth(), lit);
    expect(none.finishable).toBe(false);
    expect(none.screens).not.toContain('d1_r12');
  });

  it('would catch a key wasted on the shortcut if there were only one', () => {
    const r05 = DB.screens.d1_r05;
    const things = r05.things.filter((t) => !(t.k === 'chest' && t.id === 'd1_c_key2'));
    const db: ContentDb = { ...DB, screens: { ...DB.screens, d1_r05: { ...r05, things } } };
    const short = solve(db, atTheMouth(), lit);
    expect(short.finishable).toBe(true);
    expect(short.softLocks.some((s) => s.includes('d1_lock_a'))).toBe(true);
  });
});
