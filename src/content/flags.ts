import type { FlagSpec } from '@core/state/flags';

/** Story and world flags. Prefixes: st_ story, q_ quest, w_ world, n_ npc, ev_ event. */
export const FLAGS = {
  st_intro_seen: { t: 'bool' },
  /** The prologue's story day, 1–3. Separate from the clock's day so staying up late breaks nothing. */
  st_farm_day: { t: 'int', max: 3 },
  q_sheep_d1: { t: 'bool' },
  q_water_d1: { t: 'bool' },
  /** Logs split on day 2. */
  q_logs: { t: 'int', max: 9 },
  /** Ravens scared off on day 3. */
  q_ravens: { t: 'int', max: 9 },
  q_paid_d1: { t: 'bool' },
  q_paid_d2: { t: 'bool' },
  q_paid_d3: { t: 'bool' },
  ev_embla_d1: { t: 'bool' },
  ev_embla_d2: { t: 'bool' },
  ev_embla_d3: { t: 'bool' },
  st_raid_begun: { t: 'bool' },
  /** The raid night is over: Embla and eight villagers are gone, Halvar is wounded. */
  st_raid_done: { t: 'bool' },
  /** Halvar gave Ask his old seax and round shield. */
  st_seax_given: { t: 'bool' },
  /** Gyða told the legend of the Rime King; the gate north opens and the seasons turn again. */
  st_legend_told: { t: 'bool' },
  /** First meetings in Myrkviðr. */
  n_onundr_met: { t: 'bool' },
  n_dagny_met: { t: 'bool' },
  n_skeggi_met: { t: 'bool' },
  n_arnbjorg_met: { t: 'bool' },
  /** Ask has stepped into Rótarhellir. */
  st_d1_entered: { t: 'bool' },
  /** Rótvættr is dead. */
  st_d1_boss_dead: { t: 'bool' },
  /** The first runestone burns again. */
  st_stone1_lit: { t: 'bool' },
  /** Önundr has sawn through the pine across the road north: Uppvík lies open. */
  st_road_open: { t: 'bool' },
} as const satisfies Record<string, FlagSpec>;

export type FlagId = keyof typeof FLAGS;

export const isFlagId = (s: string): s is FlagId => Object.hasOwn(FLAGS, s);
