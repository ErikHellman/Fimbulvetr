import type { DevPreset } from '@core/dev/query';

const DAY1_DONE = {
  st_intro_seen: true,
  q_sheep_d1: true,
  q_water_d1: true,
  q_paid_d1: true,
  ev_embla_d1: true,
} as const;
const DAY2_DONE = { ...DAY1_DONE, q_logs: 5, q_paid_d2: true, ev_embla_d2: true } as const;

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
    tile: [11, 8],
    facing: 'n',
    weapon: 'handaxe',
    shield: false,
    minute: 21 * 60,
    silver: 30,
    flags: { ...DAY2_DONE, st_farm_day: 3, q_ravens: 5, q_paid_d3: true, ev_embla_d3: true },
    vars: { ask_pen: 31 },
  },
} as const satisfies Record<string, DevPreset>;

export type DevPresetId = keyof typeof DEV_PRESETS;

export const isDevPresetId = (s: string): s is DevPresetId => Object.hasOwn(DEV_PRESETS, s);
