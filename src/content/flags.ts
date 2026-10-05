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
  /** Ask has come past the rockfall into Haugar. */
  st_haugar_reached: { t: 'bool' },
  /** Styrr told Ask of the barrow-watch: the King's Barrow opens to one who keeps it at night. */
  q_rs3_watch: { t: 'bool' },
  /** Barrow-wights beaten at the King's Barrow on the watch. */
  q_watch_kills: { t: 'int', max: 3 },
  /** The watch is kept: Konungshaugr's door stands open. M4a's goal. */
  st_barrow_open: { t: 'bool' },
  /** First meetings in Haugar. */
  n_styrr_met: { t: 'bool' },
  n_hildr_met: { t: 'bool' },
  n_geirmundr_met: { t: 'bool' },
  n_hallsteinn_met: { t: 'bool' },
  /** Haugar's eyes, opened by arrows: the great cairn's door and the watchtower's bridge. */
  w_hau_cairn: { t: 'bool' },
  w_hau_watch: { t: 'bool' },
  /** Konungshaugr's latches, struck by arrows: the bridges over the pits are down for good. */
  w_d3_r05: { t: 'bool' },
  w_d3_r10: { t: 'bool' },
  w_d3_r12: { t: 'bool' },
  w_d3_r14: { t: 'bool' },
  w_d3_r15: { t: 'bool' },
  /** Ask went down into Konungshaugr. */
  st_d3_entered: { t: 'bool' },
  /** The Haugbúi King is dead (set by his death). */
  st_d3_boss_dead: { t: 'bool' },
  /** Haugvörðr, the barrow-warden, is dead (set by its death): it never rises again. */
  st_d3_warden: { t: 'bool' },
  /** The third runestone is lit: M4's goal. */
  st_stone3_lit: { t: 'bool' },
  /** Styrr taught the dash thrust: the sword pressed mid-roll lunges, and pierces a shield. */
  t_dash: { t: 'bool' },
  /** Styrr taught the parry: a blow met by a freshly raised shield is turned, and its dealer stunned. */
  t_parry: { t: 'bool' },
  /** Styrr has challenged Ask to the last duel (once both techniques are known). */
  q_duel_asked: { t: 'bool' },
  /** The duel is on: Styrr waits in his yard. Cleared by a win, a loss or leaving the yard. */
  ev_duel_on: { t: 'bool' },
  /** Ask won Styrr's last duel. */
  q_duel_won: { t: 'bool' },
  /** Styrr's last lesson: Bragð, the sword beam. */
  st_bragd_learned: { t: 'bool' },
  /** The rime across the gorge beyond the pass has melted (M6 opens the road north). */
  st_rime_open: { t: 'bool' },
  /** Sölvi taught Hlíf, the ward-song, once the pass was open. */
  st_hlif_learned: { t: 'bool' },
  /** The farm rebuilt so far: 1 the longhouse's roof, 2 the fold and byre (3–5 need ore, later). */
  q_farm: { t: 'int', max: 5 },
  /** Ask came home to Askdalr after the pass opened, into the Fimbulvetr. */
  st_home_winter: { t: 'bool' },
  /** Gyða told Ask the Rime King's binding was sworn on blood, and of her rune-record's lost leaves. */
  st_blood_told: { t: 'bool' },
  /** Arm-rings owned (one is worn at a time: `inv.ring`). Stamina halves the wait between rolls. */
  w_ring_stamina: { t: 'bool' },
  /** Thrift takes a quarter off shop prices, rounded up. */
  w_ring_thrift: { t: 'bool' },
  /** Halvar asked Ask to rebuild the farm (`q_farm`). */
  st_farm_asked: { t: 'bool' },
  /** Trades made in the trading chain: 1 the bell for a fleece, 2 yarn, 3 Gamli's hook (4–7 later). */
  q_trade: { t: 'int', max: 7 },
  /** Hildr's herding (`q_herd`): asked to start, the sixth sheep in the hurdles, and won. */
  q_herd_asked: { t: 'bool' },
  ev_herd_on: { t: 'bool' },
  q_herd_penned: { t: 'bool' },
  q_herd_done: { t: 'bool' },
  /** The eye on Askdalr's ridge, shot open: the chest with a leaf of Gyða's record appears (`q_pages`). */
  w_ask_leaf_eye: { t: 'bool' },
  /** All four leaves handed back to Gyða. */
  q_pages_done: { t: 'bool' },
  /** Önundr's troll hunt (`q_trolls`): asked, trolls the sunrise caught in the troll wood, rewarded. */
  q_trolls_asked: { t: 'bool' },
  q_trolls_stoned: { t: 'int', max: 5 },
  q_trolls_done: { t: 'bool' },
  /** Steinn's clasp (`q_steinn`): carried to Halvar, his answer, and Steinn paid for the errand. */
  q_steinn_asked: { t: 'bool' },
  q_steinn_answer: { t: 'bool' },
  q_steinn_done: { t: 'bool' },
  /** Geirmundr's grave-ring (`q_barrow_ring`): given to Ask, laid back on its mound at night, Geirmundr's thanks. */
  q_ring_given: { t: 'bool' },
  q_ring_laid: { t: 'bool' },
  q_barrow_ring_done: { t: 'bool' },
  /** Sigrún's crates (`q_crates`): asked, each crate set down at her door, how many, and her thanks. */
  q_crates_asked: { t: 'bool' },
  q_crate_a: { t: 'bool' },
  q_crate_b: { t: 'bool' },
  q_crate_c: { t: 'bool' },
  q_crates_home: { t: 'int', max: 3 },
  q_crates_done: { t: 'bool' },
  /** Þórdís's wild honey (`q_honey`): asked, and the honey brought. */
  q_honey_asked: { t: 'bool' },
  q_honey_done: { t: 'bool' },
  /** Ketill's axe range (`q_axes`): asked, a try begun, each of the five targets hit, how many, and won. */
  q_axes_asked: { t: 'bool' },
  ev_axes_on: { t: 'bool' },
  q_axe_t1: { t: 'bool' },
  q_axe_t2: { t: 'bool' },
  q_axe_t3: { t: 'bool' },
  q_axe_t4: { t: 'bool' },
  q_axe_t5: { t: 'bool' },
  q_axes_hit: { t: 'int', max: 5 },
  q_axes_done: { t: 'bool' },
  /** Ragna's amber (`q_amber`): asked, each of the three lumps found (reeds, peat, spring mud), and brought. */
  q_amber_asked: { t: 'bool' },
  q_amber_reeds: { t: 'bool' },
  q_amber_peat: { t: 'bool' },
  q_amber_mud: { t: 'bool' },
  q_amber_done: { t: 'bool' },
  /** Eyvindr's burbot (`q_burbot`): asked, one landed since, and his thanks. */
  q_burbot_asked: { t: 'bool' },
  q_burbot_caught: { t: 'bool' },
  q_burbot_done: { t: 'bool' },
  /** Out of the gorge and into Niflmýrr's fog (M6a). */
  st_niflmyrr_reached: { t: 'bool' },
  /** The bled thrall at the drained camp told why the captives were taken (the twist, M6a). */
  st_twist_heard: { t: 'bool' },
  /** Bragi the skald, met by his fire at the drained camp (M6a). */
  n_bragi_met: { t: 'bool' },
  /** Hrafn the seal-hunter, met in his hut on Niflmýrr's shore (M6a). */
  n_hrafn_met: { t: 'bool' },
  /** Heiðr's embers (`q_ljos`): asked for three wisp embers, each one caught, and Ljós taught. */
  q_ljos_asked: { t: 'bool' },
  w_ember_jars: { t: 'bool' },
  w_ember_causeway: { t: 'bool' },
  w_ember_strand: { t: 'bool' },
  q_ljos_done: { t: 'bool' },
  /** The skald's verses bought: each marks a secret on the map (see content/verses.ts). */
  w_verse_deadwood: { t: 'bool' },
  w_verse_cairns: { t: 'bool' },
  w_verse_gjoll: { t: 'bool' },
  /** Into Helgrind (D4, M6b); Garmr dead (its shutters open); Náströnd dead; Kolbeinn's word after. */
  st_d4_entered: { t: 'bool' },
  st_d4_garmr: { t: 'bool' },
  st_d4_boss_dead: { t: 'bool' },
  st_d4_kolbeinn: { t: 'bool' },
  /** Helgrind's latch: the boomerang lowers the bridge to the bone-pit's silver. */
  w_d4_r12: { t: 'bool' },
  /** The Rime King's four thanes (each has its own flag) and the eight captives freed: Act II's war count. */
  q_thanes: { t: 'int', max: 4 },
  q_captives: { t: 'int', max: 8 },
  st_thane_nastrond: { t: 'bool' },
  st_freed_ulf: { t: 'bool' },
  st_freed_tofa: { t: 'bool' },
  /**
   * Ulf's herding round at home (replayable): asked for (his trigger starts it), under way (his own pen
   * counts), and his five penned before the sand runs out.
   */
  ev_ulf_herd: { t: 'bool' },
  ev_ulf_round: { t: 'bool' },
  q_ulf_penned: { t: 'bool' },
  /**
   * Hrafn's seal-skin (M7a): asked to guard his nets, the nights the marbendill was driven off (three win
   * the skin), tonight's fight done (clears at dawn), and the skin given.
   */
  q_sealskin_asked: { t: 'bool' },
  q_seal_nights: { t: 'int', max: 3 },
  ev_seal_tonight: { t: 'bool', dawn: true },
  q_sealskin_done: { t: 'bool' },
  /** Ask has paid Bárðr and the boat is about to set off (cleared as it does, or at dawn at the latest). */
  ev_ferry: { t: 'bool', dawn: true },
  /** Embla met at the Refuge on Holmr (M7a). */
  st_embla_found: { t: 'bool' },
  /** Vala has healed Ask today (free once a day). */
  ev_vala_day: { t: 'bool', dawn: true },
  /** Sökkva Hof (D5) entered, and its thane Nykr dead (set in M7b; named now for `q_holmr`). */
  st_d5_entered: { t: 'bool' },
  st_thane_nykr: { t: 'bool' },
  /** Embla's letters (one in M7, M8 and M9), and the first one's vessel found in Myrkviðr's glade. */
  q_letters: { t: 'int', max: 3 },
  st_letter1_found: { t: 'bool' },
  /** Sökkva Hof's water level (M7b): 0 low, 1 the lower floors flooded, 2 the upper too. */
  w_d5_level: { t: 'int', max: 2 },
  /** Hrönn dead (its shutters open); Nykr dead; Kolbeinn's word after. */
  st_d5_hronn: { t: 'bool' },
  st_d5_boss_dead: { t: 'bool' },
  st_d5_kolbeinn: { t: 'bool' },
  /** Sökkva Hof's fan bridge, lowered by Vindr. */
  w_d5_r14: { t: 'bool' },
  /** Oddr and Hallbera, held in Sökkva Hof's cells until Nykr falls. */
  st_freed_oddr: { t: 'bool' },
  st_freed_hallbera: { t: 'bool' },
  /**
   * The Norns' loom (M7b, `q_loom`): the web in Myrkviðr blown clear by Vindr, the Norns met at Urðr's
   * well, and the three threads woven (the hofs can turn the season after).
   */
  w_myr_web: { t: 'bool' },
  q_loom_asked: { t: 'bool' },
  st_loom_woven: { t: 'bool' },
  /** Ívaldi's Forge's belt lever (M8b): set, the north belts run the other way. */
  w_d6_belts: { t: 'bool' },
  /** Dvergagröf reached over the chasm (M8a). */
  st_dvg_reached: { t: 'bool' },
  /**
   * Dvalinn's chain (M8a, `q_foreman`): 1 asked, 2 the cave-in cleared, 3 Hekla goes with Ask, 4 the crew
   * out of the lamp-room, 5 the cart road open.
   */
  q_foreman: { t: 'int', max: 5 },
  /** Embla's second letter followed to the cairn on Haugar's tarn (M8a). */
  st_letter2_found: { t: 'bool' },
  /** Ívaldi's Forge (D6) entered, and Belgr its mini-boss broken (M8b): his iron heart lets Sindri forge the dwarf blade. */
  st_d6_entered: { t: 'bool' },
  st_d6_belgr: { t: 'bool' },
  /** Thane Ívaldi dead (M8b): Þorkell and Rannveig freed, and Kolbeinn's word heard in his hall. */
  st_d6_boss_dead: { t: 'bool' },
  st_d6_kolbeinn: { t: 'bool' },
  st_thane_ivaldi: { t: 'bool' },
  st_freed_thorkell: { t: 'bool' },
  st_freed_rannveig: { t: 'bool' },
  /** Hrímfjöll reached over the frost line (M9a). */
  st_hrf_reached: { t: 'bool' },
  /** Ormr's beacon lit again with Sindri's lens (M9a, trading step 7): he gave the beacon arm-ring. */
  st_beacon_lit: { t: 'bool' },
  /** The beacon arm-ring owned (M9a): it marks the heart pieces still out on the map. */
  w_ring_beacon: { t: 'bool' },
  /** Embla's third letter followed to the cairn at the top of the world (M9a): the last seiðr vessel. */
  st_letter3_found: { t: 'bool' },
  /** Hrímturn (D7) entered, and Svellr its mini-boss broken over the ice mirror (M9b). */
  st_d7_entered: { t: 'bool' },
  st_d7_svellr: { t: 'bool' },
  /** Thane Hrímgerðr dead (M9b): Ása and Bjarni freed, and Kolbeinn's word heard in her hall. */
  st_d7_boss_dead: { t: 'bool' },
  st_d7_kolbeinn: { t: 'bool' },
  st_thane_hrimgerdr: { t: 'bool' },
  st_freed_asa: { t: 'bool' },
  st_freed_bjarni: { t: 'bool' },
  /** Útgarðr's gate in the ice open (M10). */
  st_utgard_open: { t: 'bool' },
} as const satisfies Record<string, FlagSpec>;

export type FlagId = keyof typeof FLAGS;

export const isFlagId = (s: string): s is FlagId => Object.hasOwn(FLAGS, s);
