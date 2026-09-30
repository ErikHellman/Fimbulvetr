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
  /** Ask has come to Uppvík's gate. */
  st_uppvik_reached: { t: 'bool' },
  /** First meetings in Uppvík. */
  n_thordis_met: { t: 'bool' },
  n_hrafnkell_met: { t: 'bool' },
  n_ketill_met: { t: 'bool' },
  n_solvi_met: { t: 'bool' },
  n_gunnhildr_met: { t: 'bool' },
  n_bersi_met: { t: 'bool' },
  n_jorunn_met: { t: 'bool' },
  n_eyvindr_met: { t: 'bool' },
  n_hjalti_met: { t: 'bool' },
  n_glumr_met: { t: 'bool' },
  n_ragna_met: { t: 'bool' },
  n_steinn_met: { t: 'bool' },
  /** Þórdís gave Ask the first mead horn. */
  w_horn_thordis: { t: 'bool' },
  /** Sölvi asked for a stave charred in Skeggi's kiln, to carve the fire-song's lesson on. */
  q_eldr_asked: { t: 'bool' },
  /** Sölvi taught Ask Eldr, the first galdr. */
  st_eldr_learned: { t: 'bool' },
  /** Heiðr the völva, in her fen hut. */
  n_heidr_met: { t: 'bool' },
  /** Heiðr asked for three clumps of fen-moss. */
  q_volva_asked: { t: 'bool' },
  /** Heiðr has the moss and brews blue mead. */
  q_volva_done: { t: 'bool' },
  /** The huldra, in the birch glade at night. */
  n_huldra_met: { t: 'bool' },
  /** Ask promised the huldra something unnamed, for her winter cloak. She will come to collect it. */
  q_huldra_promise: { t: 'bool' },
  /** Ask turned her bargain down (she asks again). */
  q_huldra_refused: { t: 'bool' },
  /** Ask took the hunters' notice from the Þing-stone: the vargr pack leader, on the north road. */
  q_vargar_taken: { t: 'bool' },
  /** Dagný told Ask how the pack leader fights. */
  q_vargar_tracked: { t: 'bool' },
  /** The pack leader is dead (set by its death). */
  q_vargar_alpha: { t: 'bool' },
  /** Bersi paid the bounty, a bigger purse. */
  q_vargar_done: { t: 'bool' },
  /** The weir's latch is struck: the drawbridge into Mýrland is down for good. */
  w_myl_bridge: { t: 'bool' },
  /** Ask has crossed the weir into Mýrland. */
  st_myrland_reached: { t: 'bool' },
  /** Þuríðr told how the mill sank and that the second stone lies in its cellar. */
  q_rs2_mill: { t: 'bool' },
  /** The pass through the mountains is open (set at the end of Act I, M5): the ferry runs. */
  st_pass_open: { t: 'bool' },
  /** First meetings in Mýrland. */
  n_kari_met: { t: 'bool' },
  n_bardr_met: { t: 'bool' },
  n_thuridr_met: { t: 'bool' },
  n_ljotr_met: { t: 'bool' },
  n_audr_met: { t: 'bool' },
  /** Kári paid for Gamli with a piece of heart. */
  q_fisher_done: { t: 'bool' },
  /** Fish Ask has landed. */
  q_fish_caught: { t: 'int', max: 99 },
  /** Ask landed Gamli, the old pike of the millpond. */
  q_fish_gamli: { t: 'bool' },
  /** Sökkva Kvern's water: 0 low (as found: the fleeing miller opened the sluices), 1 or 2. */
  w_d2_level: { t: 'int', max: 2 },
  /** Ask went down into Sökkva Kvern. */
  st_d2_entered: { t: 'bool' },
  /** Lindormr is dead (set by its death). */
  st_d2_boss_dead: { t: 'bool' },
  /** The second runestone is lit: M3's goal. */
  st_stone2_lit: { t: 'bool' },
  /** The third runestone is lit: M4's goal. */
  st_stone3_lit: { t: 'bool' },
  /** Styrr taught the dash thrust: the sword pressed mid-roll lunges, and pierces a shield. */
  t_dash: { t: 'bool' },
  /** Styrr taught the parry: a blow met by a freshly raised shield is turned, and its dealer stunned. */
  t_parry: { t: 'bool' },
} as const satisfies Record<string, FlagSpec>;

export type FlagId = keyof typeof FLAGS;

export const isFlagId = (s: string): s is FlagId => Object.hasOwn(FLAGS, s);
