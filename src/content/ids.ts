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
export const ITEMS = [...SUB_ITEMS, ...CONSUMABLES, ...UPGRADES, ...DUNGEON_ITEMS] as const;
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
] as const;
export type NpcId = (typeof NPCS)[number];

/** Quest log entries; their progress is derived from flags, never saved. */
export const QUESTS = ['q_chores', 'q_legend', 'q_runestone_1'] as const;
export type QuestId = (typeof QUESTS)[number];

export const SHOPS = ['sigrun', 'dev_shop'] as const;
export type ShopId = (typeof SHOPS)[number];

/** Dialogue graphs: one per NPC plus signs and dev samples. */
export const DIALOGUES = [...NPCS, 'dev_sign', 'dev_chat'] as const;
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
] as const;
export type ScriptId = (typeof SCRIPTS)[number];

/** Things that can be lifted, thrown, broken or split. */
export const PROPS = ['pot', 'stone', 'rock', 'pail', 'log_small', 'log_big', 'root_block', 'vines'] as const;
export type PropId = (typeof PROPS)[number];

/** Animals with simple behaviours that are not enemies. */
export const CRITTERS = ['sheep', 'raven'] as const;
export type CritterId = (typeof CRITTERS)[number];

/** Ground cover layered over terrain. Snow, drifts and mud join in later milestones. */
export const COVERS = ['tall_grass', 'leaves'] as const;
export type CoverId = (typeof COVERS)[number];
