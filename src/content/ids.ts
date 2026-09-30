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
export const QUEST_ITEMS = ['charred_stave', 'fen_moss'] as const;
export const ITEMS = [
  ...SUB_ITEMS,
  ...CONSUMABLES,
  ...UPGRADES,
  ...DUNGEON_ITEMS,
  ...KEEPSAKES,
  ...QUEST_ITEMS,
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
] as const;
export type QuestId = (typeof QUESTS)[number];

export const SHOPS = ['sigrun', 'dev_shop', 'hrafnkell', 'ketill', 'heidr'] as const;
export type ShopId = (typeof SHOPS)[number];

/** Dialogue graphs: one per NPC plus signs and dev samples. */
export const DIALOGUES = [...NPCS, 'dev_sign', 'dev_chat', 'thingstone'] as const;
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
] as const;
export type PropId = (typeof PROPS)[number];

/** Animals with simple behaviours that are not enemies. */
export const CRITTERS = ['sheep', 'raven'] as const;
export type CritterId = (typeof CRITTERS)[number];

/**
 * Ground cover layered over terrain. Tall grass, leaves and drifts are drawn on the map; snow, mud and ice
 * grow from the terrain beneath by season (see CoverDef.grows).
 */
export const COVERS = ['tall_grass', 'leaves', 'snow', 'drift', 'mud', 'ice', 'flood'] as const;
export type CoverId = (typeof COVERS)[number];
