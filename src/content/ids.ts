/** Every id the full game knows about. Adding ids is safe; renaming one needs a save migration. */
export const REGIONS = [
  'askdalr',
  'myrkvidr',
  'myrland',
  'haugar',
  'niflmyrr',
  'saevatn',
  'dvergagrof',
  'hrimfjoll',
] as const;
export type RegionId = (typeof REGIONS)[number];

export const DUNGEONS = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8'] as const;
export type DungeonId = (typeof DUNGEONS)[number];

export const SUB_ITEMS = [
  'lantern',
  'boomerang',
  'bombs',
  'bow',
  'sealskin',
  'grapple',
  'hammer',
  'mirror',
] as const;
export type SubItemId = (typeof SUB_ITEMS)[number];

export const CONSUMABLES = ['mead_red', 'mead_green', 'mead_blue', 'flatbread', 'cheese', 'arrows'] as const;
export const UPGRADES = [
  'heart_piece',
  'heart_container',
  'seidr_upgrade',
  'quiver',
  'bomb_bag',
  'purse',
] as const;
/** Found in dungeons; they go into that dungeon's saved state, never into the bag. */
export const DUNGEON_ITEMS = ['small_key', 'big_key', 'dungeon_map', 'compass'] as const;
/** Kept for good and never used from a slot: mead horns (what mead is carried in) and the winter cloak. */
export const KEEPSAKES = ['horn', 'winter_cloak'] as const;
/** Things carried for someone: a quest's token or a brew's ingredients. */
export const QUEST_ITEMS = ['charred_stave', 'fen_moss', 'wisp_ember', 'norn_thread'] as const;
/** The trading chain's goods (`q_trade`): each is traded on for the next. */
export const TRADE_ITEMS = [
  'trade_bell',
  'trade_fleece',
  'trade_yarn',
  'trade_hook',
  'trade_comb',
  'trade_needle',
  'trade_lens',
] as const;
/** Lore found and handed over: the torn leaves of Gyða's rune-record (`q_pages`), Steinn's clasp (`q_steinn`), the stolen grave-ring (`q_barrow_ring`). */
export const LORE_ITEMS = ['rune_leaf', 'mail_clasp', 'grave_ring'] as const;
/** Goods fetched for someone: wild honey (`q_honey`), amber (`q_amber`). */
export const FETCH_ITEMS = ['honey', 'amber'] as const;
/** Rune-staves: each sings its galdr once, from an item slot, for no seiðr. */
export const STAVES = ['stave_is', 'stave_skjalfti'] as const;
/** Counted goods that pay where silver does not: ore, for Hreggviðr at the Refuge (M7a). */
export const MATERIALS = ['ore'] as const;
export const ITEMS = [
  ...SUB_ITEMS,
  ...CONSUMABLES,
  ...UPGRADES,
  ...DUNGEON_ITEMS,
  ...KEEPSAKES,
  ...QUEST_ITEMS,
  ...TRADE_ITEMS,
  ...LORE_ITEMS,
  ...FETCH_ITEMS,
  ...STAVES,
  ...MATERIALS,
] as const;
export type ItemId = (typeof ITEMS)[number];

export const GALDR = ['eldr', 'is', 'farvegr', 'hlif', 'skjalfti', 'ljos', 'vindr', 'bragd'] as const;
export type GaldrId = (typeof GALDR)[number];

export const WEAPONS = ['none', 'pitchfork', 'seax', 'uppvik_sword', 'dwarf_blade', 'handaxe'] as const;
export type WeaponId = (typeof WEAPONS)[number];

export const ARMORS = ['wool_tunic', 'byrnie', 'ember_byrnie', 'runeplate'] as const;
export type ArmorId = (typeof ARMORS)[number];

export const RINGS = ['ring_stamina', 'ring_thrift', 'ring_beacon', 'ring_berserker'] as const;
export type RingId = (typeof RINGS)[number];

export const ENEMIES = [
  'dummy',
  'vargr',
  'draugr',
  'troll',
  'root_biter',
  'rotvaettr',
  'rot_bulb',
  'root_spike',
  'forest_troll',
  'vargr_alpha',
  'rime_raven',
  'vatnormr',
  'myrljos',
  'leirkrabbi',
  'lindormr',
  'lind_mound',
  'haugbui',
  'bogdraugr',
  'haugvordr',
  'haugkonungr',
  'styrr_duel',
  'mara',
  'fog_draugr',
  'helhound',
  'garmr',
  'nastrond',
  'tower_shield',
  'marbendill',
  'nykr_foal',
  'drowned',
  'hronn',
  'hronn_grate',
  'nykr',
  'jarnvordr',
  'glod',
  'belgr',
  'ivaldi',
  'isvargr',
  'frostvaettr',
  'svellr',
  'hrimgerdr',
  'icicle',
  'jotunvordr',
  'kolbeinn_boss',
  'hrimnir',
  'hrimnir_hand',
  'rime_pillar',
] as const;
export type EnemyId = (typeof ENEMIES)[number];

export const SFX = [
  'sfx_swing',
  'sfx_spin',
  'sfx_hit',
  'sfx_block',
  'sfx_roll',
  'sfx_charge',
  'sfx_talk',
  'sfx_lift',
  'sfx_throw',
  'sfx_break',
  'sfx_door',
  'sfx_buy',
  'sfx_bleat',
  'sfx_caw',
  'sfx_itemget',
  'sfx_cut',
  'sfx_hurt',
  'sfx_die',
  'sfx_growl',
  'sfx_thunder',
  'sfx_fire',
  'sfx_poof',
  'sfx_pickup',
  'sfx_gate',
  'sfx_chest',
  'sfx_secret',
  'sfx_unlock',
  'sfx_shutter',
  'sfx_switch',
  'sfx_push',
  'sfx_boomerang',
  'sfx_stun',
  'sfx_boss_hit',
  'sfx_boss_roar',
  'sfx_stone',
  'sfx_wind',
  'sfx_menu_move',
  'sfx_menu_ok',
  'sfx_save',
  'sfx_drink',
  'sfx_eldr',
  'sfx_fizzle',
  'sfx_howl',
  'sfx_shriek',
  'sfx_spit',
  'sfx_bite',
  'sfx_reel',
  'sfx_snap',
  'sfx_splash',
  'sfx_bomb',
  'sfx_fuse',
  'sfx_wheel',
  'sfx_water',
  'sfx_warp',
  'sfx_thrust',
  'sfx_parry',
  'sfx_bow',
  'sfx_wake',
  'sfx_gem',
  'sfx_axe',
  'sfx_bragd',
  'sfx_ward',
  'sfx_seal',
  'sfx_breath',
  'sfx_melt',
  'sfx_is',
  'sfx_ljos',
  'sfx_chain',
  'sfx_dive',
  'sfx_gust',
  'sfx_hammer',
  'sfx_quake',
  'sfx_sizzle',
  'sfx_bellows',
  'sfx_frost',
  'sfx_slide',
  'sfx_glass',
  'sfx_mirror',
] as const;
export type SfxId = (typeof SFX)[number];

/** Named people. Dialogue for each lives in content/dialogue/<npc>.ts. */
export const NPCS = [
  'halvar',
  'embla',
  'gyda',
  'sigrun',
  'grimr',
  'asa',
  'bjarni',
  'ulf',
  'tofa',
  'oddr',
  'hallbera',
  'thorkell',
  'rannveig',
  'kolbeinn',
  'onundr',
  'dagny',
  'skeggi',
  'arnbjorg',
  // Uppvík
  'thordis',
  'hrafnkell',
  'ketill',
  'solvi',
  'gunnhildr',
  'bersi',
  'jorunn',
  'eyvindr',
  'hjalti',
  'glumr',
  'ragna',
  'steinn',
  // Myrkviðr, deep
  'heidr',
  'huldra',
  // Mýrland
  'kari',
  'bardr',
  'thuridr',
  'ljotr',
  'audr',
  // Haugar
  'styrr',
  'hildr',
  'geirmundr',
  'hallsteinn',
  // Niflmýrr
  'thrall',
  'bragi',
  'hrafn',
  // Sævatn
  'vala',
  'hreggvidr',
  'urdr',
  'verdandi',
  'skuld',
  // Dvergagröf
  'dvalinn',
  'hekla',
  'sindri',
  'nyr',
  'nali',
  // Hrímfjöll
  'ormr',
] as const;
export type NpcId = (typeof NPCS)[number];

/** Quest log entries; their progress is derived from flags, never saved. */
export const QUESTS = [
  'q_chores',
  'q_legend',
  'q_runestone_1',
  'q_uppvik',
  'q_eldr',
  'q_volva',
  'q_huldra',
  'q_vargar',
  'q_runestone_2',
  'q_fisher',
  'q_runestone_3',
  'q_huscarl',
  'q_fimbulvetr',
  'q_farm',
  'q_trade',
  'q_herd',
  'q_pages',
  'q_trolls',
  'q_steinn',
  'q_barrow_ring',
  'q_crates',
  'q_honey',
  'q_axes',
  'q_amber',
  'q_burbot',
  'q_act2',
  'q_ljos',
  'q_sealskin',
  'q_holmr',
  'q_letters',
  'q_loom',
  'q_foreman',
  'q_forge',
  'q_rime',
  'q_king',
] as const;
export type QuestId = (typeof QUESTS)[number];

export const SHOPS = [
  'sigrun',
  'dev_shop',
  'hrafnkell',
  'ketill',
  'heidr',
  'geirmundr',
  'tofa',
  'vala',
  'hreggvidr',
  'hallbera',
  'sindri',
  'rannveig',
] as const;
export type ShopId = (typeof SHOPS)[number];

/** Dialogue graphs: one per NPC plus signs and dev samples. */
export const DIALOGUES = [
  ...NPCS,
  'dev_sign',
  'dev_chat',
  'thingstone',
  'bardr_ferry',
  'hof_season',
] as const;
export type DialogueId = (typeof DIALOGUES)[number];

/** Cutscenes and interaction scripts. */
export const SCRIPTS = [
  'dev_script',
  'dev_shop',
  'sleep',
  'embla_evening',
  'raid_begins',
  'shop_sigrun',
  'raid_gate',
  'd1_enter',
  'stone1_light',
  'hof_pray',
  'meadhall_rest',
  'upp_knock_in',
  'upp_knock_out',
  'uppvik_arrive',
  'shop_hrafnkell',
  'shop_ketill',
  'shop_heidr',
  'thing_notices',
  'myl_arrive',
  'fish_jetty',
  'widow_rest',
  'd2_enter',
  'stone2_light',
  'warp_stone',
  'hau_arrive',
  'barrow_open',
  'styrr_rest',
  'd3_enter',
  'stone3_light',
  'shop_geirmundr',
  'duel_lost',
  'duel_won',
  'pass_open',
  'home_winter',
  'find_bell',
  'herd_start',
  'herd_won',
  'herd_lost',
  'ring_laid',
  'hive',
  'axes_start',
  'axes_won',
  'axes_lost',
  'amber_reeds',
  'amber_peat',
  'amber_mud',
  'ice_hole',
  'nif_arrive',
  'd4_enter',
  'd4_pedestal',
  'd4_kolbeinn',
  'd4_gate_out',
  'shop_tofa',
  'ulf_herd_start',
  'ulf_herd_won',
  'ulf_herd_lost',
  'd4_cell_ulf',
  'd4_cell_tofa',
  'd5_enter',
  'd5_kolbeinn',
  'd5_gate_out',
  'd5_cell_oddr',
  'd5_cell_hallbera',
  'oddr_skiff',
  'shop_hallbera',
  'ferry_out',
  'ferry_back',
  'embla_found',
  'shop_vala',
  'shop_hreggvidr',
  'war_table',
  'letter1_box',
  'dvg_arrive',
  'shop_sindri',
  'dvg_mine_open',
  'escort_lost',
  'escort_done',
  'letter2_cairn',
  'd6_enter',
  'd6_kolbeinn',
  'd6_gate_out',
  'd6_cell_thorkell',
  'd6_cell_rannveig',
  'shop_rannveig',
  'd6_cistern',
  'hrf_arrive',
  'hrf_turned_back',
  'hrf_letter3',
  'hrf_sealed',
  'd7_enter',
  'd7_kolbeinn',
  'd7_gate_out',
  'd7_cell_asa',
  'd7_cell_bjarni',
  'd7_basin',
  'd8_enter',
  'd8_basin',
  'd8_kolbeinn',
  'd8_kolbeinn_yield',
  // The binding hall and the ending (M10b)
  'd8_embla',
  'd8_ending',
  'end_home',
  'end_shore',
] as const;
export type ScriptId = (typeof SCRIPTS)[number];

/** Fish that bite in Mýrland's waters; each season and part of the day has its own. */
export const FISH = ['perch', 'pike', 'bream', 'trout', 'eel', 'burbot', 'salmon', 'gamli'] as const;
export type FishId = (typeof FISH)[number];

/** Things that can be lifted, thrown, broken or split. */
export const PROPS = [
  'pot',
  'stone',
  'rock',
  'pail',
  'log_small',
  'log_big',
  'root_block',
  'vines',
  'troll_stone',
  'bramble',
  'bomb',
  'bomb_pot',
  'arrow_pot',
  'grave_gold',
  'crate_a',
  'crate_b',
  'crate_c',
  'axe',
  'wisp_ember',
] as const;
export type PropId = (typeof PROPS)[number];

/** Animals with simple behaviours that are not enemies. */
export const CRITTERS = ['sheep', 'raven'] as const;
export type CritterId = (typeof CRITTERS)[number];

/**
 * Ground cover layered over terrain. Tall grass, leaves and drifts are drawn on the map; snow, mud and ice
 * grow from the terrain beneath by season (see CoverDef.grows).
 */
export const COVERS = [
  'tall_grass',
  'leaves',
  'snow',
  'drift',
  'mud',
  'ice',
  'flood',
  'is_ice',
  'crust',
] as const;
export type CoverId = (typeof COVERS)[number];

/**
 * Achievements (M11). The browser stores earned ids across save slots, so this list is append-only like
 * every persisted id.
 */
export const ACHIEVEMENTS = [
  'ach_raid',
  'ach_stone1',
  'ach_stones',
  'ach_thane1',
  'ach_thanes',
  'ach_embla',
  'ach_king',
  'ach_spared',
  'ach_slain',
  'ach_stay',
  'ach_go',
  'ach_captives',
  'ach_letters',
  'ach_trade',
  'ach_farm',
  'ach_loom',
  'ach_gamli',
  'ach_galdr',
  'ach_warps',
  'ach_pieces',
  'ach_side',
  'ach_silver',
  'ach_record',
  'ach_feast',
] as const;
export type AchievementId = (typeof ACHIEVEMENTS)[number];
