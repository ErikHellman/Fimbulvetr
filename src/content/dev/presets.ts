import type { DevPreset } from '@core/dev/query';

const DAY1_DONE = {
  st_intro_seen: true,
  q_sheep_d1: true,
  q_water_d1: true,
  q_paid_d1: true,
  ev_embla_d1: true,
} as const;
const DAY2_DONE = { ...DAY1_DONE, q_logs: 5, q_paid_d2: true, ev_embla_d2: true } as const;
const DAY3_DONE = { ...DAY2_DONE, st_farm_day: 3, q_ravens: 5, q_paid_d3: true, ev_embla_d3: true } as const;
/** The prologue as the M1a route leaves it: silver spent on the lantern, which hangs in slot K. */
const LANTERN = { items: { lantern: 1 }, slots: ['lantern', null] } as const;

/** Where the M1b route leaves Ask: the raid over, the legend told, the gate north open. */
const MYR_FLAGS = {
  ...DAY3_DONE,
  st_raid_begun: true,
  st_raid_done: true,
  st_seax_given: true,
  st_legend_told: true,
} as const;

/** Dev starting points for `?preset=`. Content milestones add story presets (day2, night3, …). */
export const DEV_PRESETS = {
  /** The M0 test kit: seax and shield in the test lands. */
  m0: { screen: 'test_a', tile: [10, 11], weapon: 'seax', shield: true },
  /** Morning of the second farm day, in the farmyard. */
  day2: {
    screen: 'ask_farmyard',
    tile: [14, 12],
    weapon: 'handaxe',
    shield: false,
    minute: 6 * 60,
    silver: 10,
    flags: { ...DAY1_DONE, st_farm_day: 2 },
    vars: { ask_pen: 31 },
  },
  /** Morning of the third farm day, in the farmyard. */
  day3: {
    screen: 'ask_farmyard',
    tile: [14, 12],
    weapon: 'handaxe',
    shield: false,
    minute: 6 * 60,
    silver: 20,
    flags: { ...DAY2_DONE, st_farm_day: 3 },
    vars: { ask_pen: 31 },
  },
  /** The third evening, by Ask's bed: sleeping now starts the raid. */
  night3: {
    screen: 'ask_int_longhouse',
    tile: [10, 8],
    facing: 'n',
    weapon: 'handaxe',
    shield: false,
    minute: 21 * 60,
    silver: 30,
    flags: DAY3_DONE,
    vars: { ask_pen: 31 },
  },
  /** The raid night: Ask has just woken to fire, pitchfork in hand. */
  raid: {
    screen: 'ask_int_longhouse',
    tile: [10, 8],
    facing: 's',
    weapon: 'pitchfork',
    shield: false,
    minute: 2 * 60,
    season: 'autumn',
    silver: 5,
    ...LANTERN,
    flags: { ...DAY3_DONE, st_raid_begun: true },
    vars: { ask_pen: 31 },
  },
  /** The morning after the raid, by Halvar's bed. */
  morning: {
    screen: 'ask_int_longhouse',
    tile: [25, 8],
    facing: 'e',
    weapon: 'pitchfork',
    shield: false,
    minute: 7 * 60,
    season: 'autumn',
    silver: 5,
    ...LANTERN,
    flags: { ...DAY3_DONE, st_raid_begun: true, st_raid_done: true },
    vars: { ask_pen: 31 },
  },
  /** Myrkviðr after the legend: seax and shield, the lantern, the clock turning. */
  myr: {
    screen: 'myr_road_s',
    tile: [19, 18],
    facing: 'n',
    weapon: 'seax',
    shield: true,
    minute: 9 * 60,
    season: 'autumn',
    policy: 'cycling',
    silver: 5,
    ...LANTERN,
    flags: MYR_FLAGS,
    vars: { ask_pen: 31 },
  },
  /** Myrkviðr in autumn with Eldr learned and a full seiðr bar: burn the leaf piles. */
  eldr: {
    screen: 'myr_pines',
    tile: [20, 10],
    facing: 'w',
    weapon: 'seax',
    shield: true,
    minute: 12 * 60,
    season: 'autumn',
    policy: 'cycling',
    silver: 40,
    ...LANTERN,
    flags: MYR_FLAGS,
    vars: { ask_pen: 31 },
    galdr: ['eldr'],
  },
  /** After Rótarhellir, by Önundr in his clearing: he saws the pine, and the road north opens. */
  north: {
    screen: 'myr_clearing',
    tile: [23, 12],
    facing: 'n',
    weapon: 'seax',
    shield: true,
    minute: 10 * 60,
    season: 'autumn',
    policy: 'cycling',
    silver: 30,
    items: { lantern: 1, boomerang: 1 },
    slots: ['lantern', 'boomerang'],
    flags: {
      ...MYR_FLAGS,
      n_onundr_met: true,
      st_d1_entered: true,
      st_d1_boss_dead: true,
      st_stone1_lit: true,
    },
    vars: { ask_pen: 31 },
    maxHp: 16,
    hp: 16,
    pieces: ['hp_d1_r09'],
    opened: ['d1_hc'],
    dungeons: { d1: { bossDead: true } },
  },
  /** A winter night on the Myrkviðr road, half an hour before sunrise: snow, rolled foes and trolls. */
  turning: {
    screen: 'myr_road',
    tile: [20, 18],
    facing: 'n',
    weapon: 'seax',
    shield: true,
    minute: 6 * 60 + 30,
    season: 'winter',
    policy: 'cycling',
    silver: 5,
    ...LANTERN,
    flags: MYR_FLAGS,
    vars: { ask_pen: 31 },
  },

  /** Uppvík's square at noon, newly arrived: the road open, silver for the smith, no horn yet. */
  uppvik: {
    screen: 'upp_square',
    tile: [20, 14],
    facing: 'n',
    weapon: 'seax',
    shield: true,
    minute: 12 * 60,
    season: 'autumn',
    policy: 'cycling',
    silver: 100,
    items: { lantern: 1, boomerang: 1 },
    slots: ['lantern', 'boomerang'],
    flags: {
      ...MYR_FLAGS,
      n_onundr_met: true,
      st_d1_entered: true,
      st_d1_boss_dead: true,
      st_stone1_lit: true,
      st_road_open: true,
      st_uppvik_reached: true,
    },
    vars: { ask_pen: 31 },
    maxHp: 16,
    hp: 16,
    pieces: ['hp_d1_r09'],
    opened: ['d1_hc'],
    dungeons: { d1: { bossDead: true } },
  },

  /** At the mouth of Rótarhellir, just inside: seax, shield and the lantern. */
  d1: {
    screen: 'd1_r01',
    tile: [19, 18],
    facing: 'n',
    weapon: 'seax',
    shield: true,
    minute: 9 * 60,
    season: 'autumn',
    policy: 'cycling',
    silver: 5,
    ...LANTERN,
    flags: { ...MYR_FLAGS, st_d1_entered: true },
    vars: { ask_pen: 31 },
  },
  /** At the door of Rótvættr's lair with everything D1 gives: the boomerang in slot K, the way open. */
  d1boss: {
    screen: 'd1_r11',
    tile: [19, 3],
    facing: 'n',
    weapon: 'seax',
    shield: true,
    minute: 9 * 60,
    season: 'autumn',
    policy: 'cycling',
    silver: 25,
    items: { lantern: 1, boomerang: 1 },
    slots: ['boomerang', 'lantern'],
    flags: { ...MYR_FLAGS, st_d1_entered: true },
    vars: { ask_pen: 31 },
    opened: ['d1_c_key1', 'd1_c_key2', 'd1_c_map', 'd1_c_compass', 'd1_c_boomerang'],
    dungeons: {
      d1: {
        keys: 1,
        map: true,
        compass: true,
        doors: ['d1_sh_r04', 'd1_sh_r05', 'd1_lock_b', 'd1_sh_r07', 'd1_sh_boss'],
      },
    },
  },
} as const satisfies Record<string, DevPreset>;

export type DevPresetId = keyof typeof DEV_PRESETS;

export const isDevPresetId = (s: string): s is DevPresetId => Object.hasOwn(DEV_PRESETS, s);
