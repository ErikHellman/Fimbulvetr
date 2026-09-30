import { describe, expect, it, vi } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import { NEW_GAME } from '@content/start';
import { SCREEN_IDS } from '@content/world/screens';
import { applyPreset } from '@core/dev/query';
import { solve } from '@core/progress/solver';
import { SEASONS, type Season } from '@core/clock/types';
import type { ContentDb } from '@core/sim/db';
import { newGame, type GameState } from '@core/state/gameState';
import { TILE } from '@core/world/dims';

// Whole-world solves (every screen, one season at a time) take a few seconds each.
vi.setConfig({ testTimeout: 60_000 });

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

/** Where the M1c route leaves Ask: by Önundr, the first stone lit, the road north still under the pine. */
function atOnundr(over: (s: GameState) => void = () => undefined): GameState {
  const s = newGame(1, NEW_GAME);
  applyPreset(s, DEV_PRESETS.north);
  over(s);
  return s;
}

const uppvik = SCREEN_IDS.filter((id) => id.startsWith('upp_'));
const nothing = (): boolean => false;

describe('the progression solver on Myrkviðr and Uppvík', () => {
  it('keeps Uppvík closed until Önundr saws through the pine', () => {
    const shut = solve(DB, atOnundr(), nothing);
    for (const id of uppvik) expect(shut.screens, id).not.toContain(id);
    const open = solve(
      DB,
      atOnundr((s) => (s.flags.st_road_open = true)),
      nothing,
    );
    for (const id of uppvik) expect(open.screens, id).toContain(id);
    for (const id of ['myr_fen', 'myr_int_volva', 'myr_glade', 'myr_trollskog'] as const)
      expect(open.screens, id).toContain(id);
  });

  it('reaches every Myrkviðr piece of heart, the fen’s only with Eldr', () => {
    const road = (s: GameState): void => {
      s.flags.st_road_open = true;
    };
    const blade = solve(DB, atOnundr(road), nothing);
    expect(blade.pieces).toEqual(
      expect.arrayContaining(['hp_myr_pines', 'hp_myr_brook', 'hp_myr_trollskog']),
    );
    expect(blade.pieces).not.toContain('hp_myr_fen');
    const eldr = solve(
      DB,
      atOnundr((s) => {
        road(s);
        s.inv.galdr = ['eldr'];
      }),
      nothing,
    );
    expect(eldr.pieces).toEqual(
      expect.arrayContaining(['hp_myr_pines', 'hp_myr_brook', 'hp_myr_trollskog', 'hp_myr_fen']),
    );
  });

  it('never shuts Ask in or out at night: the warden opens the gate to a knock', () => {
    const night = (screen: 'upp_square' | 'myr_north', tile: readonly [number, number]) =>
      atOnundr((s) => {
        s.flags.st_road_open = true;
        s.flags.st_uppvik_reached = true;
        s.clock.minute = 23 * 60;
        s.hero.screen = screen;
        s.hero.x = tile[0] * TILE + TILE / 2;
        s.hero.y = tile[1] * TILE + TILE - 2;
      });
    const inside = solve(DB, night('upp_square', [20, 14]), nothing);
    expect(inside.screens).toContain('myr_north');
    expect(inside.stranded).toEqual([]);
    const outside = solve(DB, night('myr_north', [19, 10]), nothing);
    for (const id of uppvik) expect(outside.screens, id).toContain(id);
    expect(outside.stranded).toEqual([]);
  });
});

describe('the Myrkviðr and Uppvík gates in every season (winter ice, spring floods)', () => {
  const road = (s: GameState): void => {
    s.flags.st_road_open = true;
  };
  it.each(SEASONS)('%s: Uppvík stays shut behind the pine, and nothing strands Ask', (season) => {
    const shut = solve(DB, atOnundr(), nothing, { season });
    for (const id of uppvik) expect(shut.screens, id).not.toContain(id);
    expect(shut.stranded).toEqual([]);
    const open = solve(DB, atOnundr(road), nothing, { season });
    for (const id of uppvik) expect(open.screens, id).toContain(id);
    expect(open.stranded).toEqual([]);
  });

  it.each(SEASONS)('%s: the fen’s piece of heart still needs Eldr', (season) => {
    const blade = solve(DB, atOnundr(road), nothing, { season });
    expect(blade.pieces).toEqual(expect.arrayContaining(['hp_myr_pines', 'hp_myr_trollskog']));
    expect(blade.pieces).not.toContain('hp_myr_fen');
  });
});

const myrland = SCREEN_IDS.filter((id) => id.startsWith('myl_'));

/** Where M2 leaves Ask, at the brook's bank path down to the weir (preset `myl`). */
function atTheBrook(boomerang = true): GameState {
  const s = newGame(1, NEW_GAME);
  applyPreset(s, DEV_PRESETS.myl);
  if (!boomerang) {
    delete s.inv.items.boomerang;
    s.inv.slots = ['lantern', null];
  }
  return s;
}

/** The world with Rótarhellir's boomerang chest giving cheese instead: no boomerang to be had anywhere. */
const NO_BOOMERANG: ContentDb = (() => {
  const r07 = DB.screens.d1_r07;
  const things = r07.things.map((t) =>
    t.k === 'chest' && t.id === 'd1_c_boomerang' ? { ...t, gives: { item: 'cheese' as const } } : t,
  );
  return { ...DB, screens: { ...DB.screens, d1_r07: { ...r07, things } } };
})();

const withBoomerang = new Map<Season, ReturnType<typeof solve>>();
const solveMyrland = (season: Season) => {
  let r = withBoomerang.get(season);
  if (r === undefined) {
    r = solve(DB, atTheBrook(), nothing, { season });
    withBoomerang.set(season, r);
  }
  return r;
};

describe('the progression solver on Mýrland, in every season', () => {
  it.each(SEASONS)('%s: the weir holds without the boomerang', (season) => {
    const r = solve(NO_BOOMERANG, atTheBrook(false), nothing, { season });
    expect(r.screens).toContain('myl_weir');
    for (const id of myrland.filter((m) => m !== 'myl_weir')) expect(r.screens, id).not.toContain(id);
    expect(r.stranded).toEqual([]);
  });

  it.each(SEASONS)('%s: with it, all of Mýrland opens and nothing strands Ask', (season) => {
    const r = solveMyrland(season);
    for (const id of myrland) expect(r.screens, id).toContain(id);
    expect(r.scripts).toEqual(expect.arrayContaining(['fish_jetty', 'widow_rest']));
    expect(r.stranded).toEqual([]);
    // The reed islet's piece lies beyond the boomerang's reach: only the winter ice walks out to it.
    expect(r.pieces.includes('hp_myl_reeds')).toBe(season === 'winter');
  });

  it('floods the shoal in spring, and the old bridge still leads south', () => {
    expect(solveMyrland('spring').screens).toEqual(
      expect.arrayContaining(['myl_reeds', 'myl_bog', 'myl_peat']),
    );
  });
});
