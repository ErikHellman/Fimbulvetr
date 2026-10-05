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

/** Mýrland's screens, but for the cave behind the springs' cracked rock (bombs open it, M3b). */
const myrland = SCREEN_IDS.filter((id) => id.startsWith('myl_') && id !== 'myl_int_cave');

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

  it.each(SEASONS)('%s: the springs’ cave and the peat’s piece stay shut without bombs', (season) => {
    const r = solveMyrland(season);
    expect(r.screens).not.toContain('myl_int_cave');
    expect(r.pieces).not.toContain('hp_myl_peat');
  });

  it('opens both with bombs, and nothing strands Ask', () => {
    const bombs = atTheBrook();
    bombs.inv.items.bombs = 10;
    const r = solve(DB, bombs, nothing, { season: 'autumn' });
    expect(r.opened).toEqual(expect.arrayContaining(['myl_k_springs', 'myl_k_peat', 'myl_c_bombbag']));
    expect(r.pieces).toContain('hp_myl_peat');
    expect(r.stranded).toEqual([]);
  });

  it('floods the shoal in spring, and the old bridge still leads south', () => {
    expect(solveMyrland('spring').screens).toEqual(
      expect.arrayContaining(['myl_reeds', 'myl_bog', 'myl_peat']),
    );
  });
});

/** Haugar's overworld and Styrr's cottage, but for the great cairn (an eye opens it to the bow, M4b). */
const haugar = SCREEN_IDS.filter((id) => id.startsWith('hau_') && id !== 'hau_int_cairn');

/** Where M3 leaves Ask, in the birch glade by the path east (preset `hau`); `bombs` false takes them. */
function inTheGlade(bombs = true): GameState {
  const s = newGame(1, NEW_GAME);
  applyPreset(s, DEV_PRESETS.hau);
  if (!bombs) {
    delete s.inv.items.bombs;
    s.inv.slots = ['boomerang', 'lantern'];
  }
  return s;
}

const withBombs = new Map<Season, ReturnType<typeof solve>>();
const solveHaugar = (season: Season) => {
  let r = withBombs.get(season);
  if (r === undefined) {
    r = solve(DB, inTheGlade(), nothing, { season });
    withBombs.set(season, r);
  }
  return r;
};

describe('the progression solver on Haugar, in every season', () => {
  it.each(SEASONS)('%s: the rockfall keeps Haugar shut without bombs', (season) => {
    const r = solve(DB, inTheGlade(false), nothing, { season });
    expect(r.screens).toContain('hau_gully');
    for (const id of haugar.filter((h) => h !== 'hau_gully')) expect(r.screens, id).not.toContain(id);
    expect(r.opened).not.toContain('hau_k_gully');
    expect(r.stranded).toEqual([]);
  });

  it.each(SEASONS)('%s: with bombs, all of Haugar opens and nothing strands Ask', (season) => {
    const r = solveHaugar(season);
    for (const id of haugar) expect(r.screens, id).toContain(id);
    expect(r.opened).toEqual(expect.arrayContaining(['hau_k_gully', 'hau_k_barrows']));
    expect(r.pieces).toEqual(expect.arrayContaining(['hp_hau_barrows', 'hp_hau_tarn']));
    expect(r.scripts).toContain('styrr_rest');
    expect(r.stranded).toEqual([]);
  });

  it.each(SEASONS)('%s: the cairn’s quiver and the watchtower’s piece wait for the bow', (season) => {
    const r = solveHaugar(season);
    expect(r.screens).not.toContain('hau_int_cairn');
    expect(r.pieces).not.toContain('hp_hau_watch');
    const bow = inTheGlade();
    bow.inv.items.bow = 1;
    const b = solve(DB, bow, nothing, { season });
    expect(b.screens).toContain('hau_int_cairn');
    expect(b.opened).toContain('hau_c_quiver');
    expect(b.pieces).toContain('hp_hau_watch');
    expect(b.stranded).toEqual([]);
  });

  it('fetches the tarn’s piece with the boomerang, or over winter ice', () => {
    const noBoomerang = (): GameState => {
      const s = inTheGlade();
      delete s.inv.items.boomerang;
      s.inv.slots = ['bombs', 'lantern'];
      return s;
    };
    const autumn = solve(NO_BOOMERANG, noBoomerang(), nothing, { season: 'autumn' });
    expect(autumn.pieces).not.toContain('hp_hau_tarn');
    expect(solve(NO_BOOMERANG, noBoomerang(), nothing, { season: 'winter' }).pieces).toContain('hp_hau_tarn');
  });
});

/** Where M5a leaves Ask: the pass open and the lowlands under the Fimbulvetr. */
function underTheFimbulvetr(): GameState {
  const s = newGame(1, NEW_GAME);
  applyPreset(s, DEV_PRESETS.haubow);
  Object.assign(s.flags, { st_pass_open: true, st_home_winter: true });
  return s;
}

describe('the progression solver after the pass opens (the Fimbulvetr)', () => {
  it('reaches every lowland screen and every M5b side-quest spot in winter, and nothing strands Ask', () => {
    // Helgrind has proofs of its own (solver_d4): leaving it out keeps this solve from branching on its keys.
    const within = SCREEN_IDS.filter((id) => DB.screens[id].dungeon !== 'd4');
    const r = solve(DB, underTheFimbulvetr(), nothing, { season: 'winter', within });
    // Holmr's hall lies past the warm ring and the Norns' cave under a dive: the seal-skin (Hrafn's nights)
    // has its own proofs (M7a). Dvergagröf lies past the chasm, over the grapple (M8a, its own proofs).
    const lowland = SCREEN_IDS.filter(
      (id) =>
        DB.screens[id].dungeon === undefined &&
        !id.startsWith('test_') &&
        id !== 'ref_int_hall' &&
        id !== 'sae_int_well' &&
        (id === 'dvg_chasm' || !id.startsWith('dvg_')) &&
        // Hrímfjöll lies past Dvergagröf and the killing frost (M9a, its own proofs).
        !id.startsWith('hrf_'),
    );
    for (const id of lowland) expect(r.screens, id).toContain(id);
    expect(r.scripts).toEqual(
      expect.arrayContaining(['find_bell', 'hive', 'amber_reeds', 'amber_peat', 'amber_mud', 'ice_hole']),
    );
    expect(r.stranded).toEqual([]);
  });

  it('melts the rime into Niflmýrr only with Eldr', () => {
    const into = (s: GameState) => s.flags.st_rime_open === true;
    const atThePass = (eldr: boolean): GameState => {
      const s = underTheFimbulvetr();
      s.hero.screen = 'hau_pass';
      s.hero.x = 20 * TILE + TILE / 2;
      s.hero.y = 8 * TILE + TILE - 1;
      if (!eldr) s.inv.galdr = s.inv.galdr.filter((g) => g !== 'eldr');
      return s;
    };
    const pass = { season: 'winter', within: ['hau_pass', 'nif_gorge'] } as const;
    const warm = solve(DB, atThePass(true), into, pass);
    expect(warm.finishable).toBe(true);
    expect(warm.screens).toContain('nif_gorge');
    const cold = solve(DB, atThePass(false), into, pass);
    expect(cold.finishable).toBe(false);
    expect(cold.screens).not.toContain('nif_gorge');
  });

  it('reaches the cairns pool’s heart piece in summer only with Ís (a stave will do)', () => {
    const got = (s: GameState) => s.world.pieces.includes('hp_nif_cairns');
    const atTheCairns = (frost: 'none' | 'galdr' | 'stave'): GameState => {
      const s = underTheFimbulvetr();
      s.hero.screen = 'nif_cairns';
      s.hero.x = 17 * TILE + TILE / 2;
      s.hero.y = 4 * TILE + TILE - 1;
      if (frost === 'galdr') s.inv.galdr = [...s.inv.galdr, 'is'];
      if (frost === 'stave') s.inv.items = { ...s.inv.items, stave_is: 1 };
      return s;
    };
    const cairns = { season: 'summer', within: ['nif_cairns'] } as const;
    expect(solve(DB, atTheCairns('none'), got, cairns).finishable).toBe(false);
    expect(solve(DB, atTheCairns('galdr'), got, cairns).finishable).toBe(true);
    expect(solve(DB, atTheCairns('stave'), got, cairns).finishable).toBe(true);
    expect(solve(DB, atTheCairns('none'), got, { ...cairns, season: 'winter' }).finishable).toBe(true);
  });

  it('walks the dead wood’s drowned path to its heart piece', () => {
    const s = underTheFimbulvetr();
    s.hero.screen = 'nif_deadwood';
    s.hero.x = 8 * TILE + TILE / 2;
    s.hero.y = 14 * TILE + TILE - 1;
    const r = solve(DB, s, (g) => g.world.pieces.includes('hp_nif_deadwood'), {
      season: 'summer',
      within: ['nif_deadwood'],
    });
    expect(r.finishable).toBe(true);
  });

  it('walks all of Niflmýrr from the pass once the rime is melted, in every season, stranding nothing', () => {
    const nif = SCREEN_IDS.filter((id) => id.startsWith('nif_'));
    expect(nif).toHaveLength(12);
    for (const season of ['winter', 'summer'] as const) {
      const s = underTheFimbulvetr();
      s.flags.st_rime_open = true;
      s.hero.screen = 'hau_pass';
      s.hero.x = 20 * TILE + TILE / 2;
      s.hero.y = 8 * TILE + TILE - 1;
      const r = solve(DB, s, nothing, { season, within: ['hau_pass', ...nif] });
      for (const id of nif) expect(r.screens, `${season} ${id}`).toContain(id);
      expect(r.opened, season).toEqual(expect.arrayContaining(['nif_k_jars', 'nif_c_cave']));
      expect(r.stranded, season).toEqual([]);
    }
  });
});
