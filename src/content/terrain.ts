import type { TerrainDef } from '@core/world/terrain';

export const TERRAIN_IDS = [
  'grass',
  'path',
  'water',
  'rock',
  'tree',
  'ledge',
  'fence',
  'field',
  'yard',
  'roof',
  'wall',
  'door',
  'floor',
  'wall_int',
  'void',
  'ford',
  'well',
  'trough',
  'stump',
  'bed',
  'hearth',
  'table',
  'menhir',
  'door_shut',
  'window',
  'chimney',
  'jetty',
  'pine',
  'log',
  'mound',
  'kiln',
  'cave_floor',
  'cave_wall',
  'sap',
  'roots',
  'runestone',
  'cave_mouth',
  'planks',
  'palisade',
  'sand',
  'stall',
  'thingstone',
  'anvil',
  'bog',
  'reeds',
  'birch',
  'moss',
  'boulder',
  'rapids',
  'spring',
  'shoal',
  'peat',
  'mill',
  'boat',
  'sluice',
  'sluice_hi',
  'race',
  'race_hi',
  'boards',
  'mill_wall',
  'silt',
  'heath',
  'barrow',
  'cairn',
  'flagstone',
  'drystone',
  'tent',
  'crypt_floor',
  'crypt_wall',
  'pit',
  'ghost',
  'blackwater',
  'snag',
  'mire',
  'drowned_path',
  /** Sævatn (M7a): currents a swimmer is carried by, and surges only a diver crosses. */
  'current_n',
  'current_e',
  'current_s',
  'current_w',
  'surge_n',
  'surge_e',
  'surge_s',
  'surge_w',
  /** Sökkva Hof (M7b): flagstone floors that flood at water level 1 or 2, and sunken arches over the deep. */
  'hof_floor',
  'hof_floor_hi',
  'arch',
  /** Dvergagröf and Ívaldi's Forge (M8): scree, the forge's floor and walls, lava and conveyor belts. */
  'scree',
  'forge_floor',
  'forge_wall',
  'lava',
  'belt_n',
  'belt_e',
  'belt_s',
  'belt_w',
  /** Hrímfjöll and Hrímturn (M9): firn, glaze, rime cliffs, and the tower's glass floor and walls. */
  'firn',
  'glaze',
  'rime',
  'tower_floor',
  'tower_wall',
  /** Hrímturn (M9b): a wall of clear ice that light shines through. */
  'clear_ice',
  /** Útgarðr (M10a): the giants' floor of great grey flags, and walls of blocks a giant could lift. */
  'giant_floor',
  'giant_wall',
] as const;
export type TerrainId = (typeof TERRAIN_IDS)[number];

export const TERRAIN = {
  grass: { solid: false },
  path: { solid: false },
  water: { solid: true, low: true, swim: true },
  rock: { solid: true },
  tree: { solid: true, decor: { art: ['decor_tree', 'decor_pine'], w: 1, h: 1 } },
  /** A low bank you can hop down (south) but not climb. */
  ledge: { solid: false, ledge: 's' },
  fence: { solid: true },
  /** Barley: walkable, a little slow. */
  field: { solid: false, slow: 0.85 },
  yard: { solid: false },
  /** Turf roofs of longhouses, seen from above. */
  roof: { solid: true },
  /** A longhouse's front wall. */
  wall: { solid: true },
  /** A doorway in a wall; the door Thing on it does the rest. */
  door: { solid: false },
  floor: { solid: false },
  wall_int: { solid: true },
  /** Nothing: the black around interior rooms. */
  void: { solid: true },
  /** Shallow stream crossing. */
  ford: { solid: false, slow: 0.7 },
  well: { solid: true, decor: { art: ['decor_well'], w: 2, h: 2 } },
  trough: { solid: true, decor: { art: ['decor_trough'], w: 3, h: 1 } },
  /** The chopping block. */
  stump: { solid: true, decor: { art: ['decor_stump'], w: 1, h: 1 } },
  bed: { solid: true, decor: { art: ['decor_bed'], w: 1, h: 2 } },
  hearth: { solid: true, decor: { art: ['decor_hearth'], w: 2, h: 2 } },
  table: { solid: true, decor: { art: ['decor_table'], w: 2, h: 1 } },
  /** A standing stone. */
  menhir: { solid: true, decor: { art: ['decor_menhir'], w: 1, h: 1 } },
  /** A closed door on a house you cannot enter. */
  door_shut: { solid: true },
  /** A window in a house wall. */
  window: { solid: true },
  /** A chimney stack on a roof; the shell puts smoke on it. */
  chimney: { solid: true },
  /** Planks over water: walkable, water laps right up to its edge. */
  jetty: { solid: false },
  /** Old pines of Myrkviðr, packed tight. */
  pine: { solid: true, decor: { art: ['decor_pine', 'decor_pine_old'], w: 1, h: 1 } },
  /** A fallen trunk across a road, four tiles long. */
  log: { solid: true, decor: { art: ['decor_log'], w: 4, h: 1 } },
  /** A grave mound, where draugr climb out at night. */
  mound: { solid: false },
  /** A charcoal-burner's earth kiln; the shell smokes its vent. */
  kiln: { solid: true, decor: { art: ['decor_kiln'], w: 3, h: 2 } },
  /** Rótarhellir's packed-earth floor. */
  cave_floor: { solid: false },
  /** Rock walls of the cave. */
  cave_wall: { solid: true },
  /** A pool of sticky sap: no footing, but the boomerang flies over it. */
  sap: { solid: true, low: true },
  /** Yggdrasil's own roots, too thick to cut: a wall. */
  roots: { solid: true },
  /** The first of the eight runestones. */
  runestone: { solid: true, decor: { art: ['decor_runestone'], w: 1, h: 1 } },
  /** A dark opening in the rock; a door thing leads through it. */
  cave_mouth: { solid: false },
  /** Uppvík's plank walks over the mud of its streets. */
  planks: { solid: false },
  /** The town palisade: sharpened stakes, shoulder to shoulder. */
  palisade: { solid: true },
  /** The bay's pale shore. */
  sand: { solid: false },
  /** A market stall under a striped awning, three tiles wide. */
  stall: { solid: true, decor: { art: ['decor_stall'], w: 3, h: 1 } },
  /** The Þing-stone of Uppvík, where notices are pinned: two tiles wide. */
  thingstone: { solid: true, decor: { art: ['decor_thingstone'], w: 2, h: 1 } },
  /** The smith's anvil on its block. */
  anvil: { solid: true, decor: { art: ['decor_anvil'], w: 1, h: 1 } },
  /** Fen ground, black water between the tussocks: walkable, slow. */
  bog: { solid: false, slow: 0.6 },
  /** A stand of fen reeds, too thick to push through. */
  reeds: { solid: true, decor: { art: ['decor_reeds'], w: 1, h: 1 } },
  /** A white birch; they ring the huldra's glade. */
  birch: { solid: true, decor: { art: ['decor_birch'], w: 1, h: 1 } },
  /** The troll wood's floor: deep moss where no sun reaches. */
  moss: { solid: false },
  /** A mossy boulder (or a troll the sun caught long ago). */
  boulder: { solid: true, decor: { art: ['decor_boulder'], w: 1, h: 1 } },
  /** White water over stones: too fast to wade, and it never freezes (the boomerang flies over it). */
  rapids: { solid: true, low: true },
  /** Warm spring water, steaming: no footing, and no winter ever freezes it. */
  spring: { solid: true, low: true, swim: true },
  /** A gravel shoal across a river: wadeable, slow, and under the spring flood (see COVER_DEFS.flood). */
  shoal: { solid: false, slow: 0.7 },
  /** Cut peat banks: dark, soft ground. */
  peat: { solid: false, slow: 0.9 },
  /** The drowned mill's roof standing out of its pond, four tiles wide and three deep. */
  mill: { solid: true, decor: { art: ['decor_mill'], w: 4, h: 3 } },
  /** Bárðr's ferry boat, moored at his landing, three tiles long. */
  boat: { solid: true, decor: { art: ['decor_boat'], w: 3, h: 1 } },
  /** A mill-race's stone floor: dry at the lowest water, flooded once the level reaches 1. */
  sluice: { solid: false, rise: { floods: 1 } },
  /** A higher sluice floor, flooded only at the top level (2). */
  sluice_hi: { solid: false, rise: { floods: 2 } },
  /** A race channel whose planks float up to the brim at level 1; below that, a drop (the boomerang crosses). */
  race: { solid: true, low: true, rise: { floats: 1 } },
  /** A deeper race whose planks float only at the top level (2). */
  race_hi: { solid: true, low: true, rise: { floats: 2 } },
  /** The sunken mill's floor: old wet boards. */
  boards: { solid: false },
  /** The mill's walls: dressed stone below, timber above. */
  mill_wall: { solid: true },
  /** Grey silt at the bottom of the millpond, where Lindormr lies: soft and slow. */
  silt: { solid: false, slow: 0.8 },
  /** Haugar's heather moor: purple-brown and springy underfoot. */
  heath: { solid: false },
  /** The flank of a great grave-hill: steep turf, not to be climbed. */
  barrow: { solid: true },
  /** A cairn of piled stones over the old dead. */
  cairn: { solid: true, decor: { art: ['decor_cairn'], w: 1, h: 1 } },
  /** Old paving: the stone circle's floor, the watchtower's yard. */
  flagstone: { solid: false },
  /** A dry-stone wall, shoulder high. */
  drystone: { solid: true },
  /** Geirmundr's tent of patched hides, three tiles wide and two deep. */
  tent: { solid: true, decor: { art: ['decor_tent'], w: 3, h: 2 } },
  /** Konungshaugr's floor: old flags, grave-dust in the cracks. */
  crypt_floor: { solid: false },
  /** The barrow's walls: dry stone and turf, old timber in the dark. */
  crypt_wall: { solid: true },
  /** A drop into the barrow's depths: no footing, but arrows and the boomerang fly over it. */
  pit: { solid: true, low: true },
  /** Hidden floor over the pits: sound underfoot, but drawn as the pit it spans; only light shows it. */
  ghost: { solid: false, hidden: true },
  /** Niflmýrr's still black pools: no footing, and so cold and dead that no winter skins them with ice. */
  blackwater: { solid: true, low: true },
  /** A dead tree in the fog marsh, grey and barkless. */
  snag: { solid: true, decor: { art: ['decor_snag'], w: 1, h: 1 } },
  /** Niflmýrr's ground: grey-green sedge over sodden peat. */
  mire: { solid: false },
  /** A drowned causeway just under the black water: sound underfoot, but only light shows it. */
  drowned_path: { solid: false, hidden: true },
  /** Lake water running one way: it carries a swimmer along and never freezes. */
  current_n: { solid: true, low: true, swim: true, current: 'n' },
  current_e: { solid: true, low: true, swim: true, current: 'e' },
  current_s: { solid: true, low: true, swim: true, current: 's' },
  current_w: { solid: true, low: true, swim: true, current: 'w' },
  /** A surge: faster than anyone swims; only a diver passes under it. */
  surge_n: { solid: true, low: true, swim: true, current: 'n', strong: true },
  surge_e: { solid: true, low: true, swim: true, current: 'e', strong: true },
  surge_s: { solid: true, low: true, swim: true, current: 's', strong: true },
  surge_w: { solid: true, low: true, swim: true, current: 'w', strong: true },
  /** Sökkva Hof's floor: dry flagstones at low water, deep water (swum with the seal-skin) from level 1. */
  hof_floor: { solid: false, swim: true, rise: { floods: 1 } },
  /** A higher floor, flooded only at the top level (2). */
  hof_floor_hi: { solid: false, swim: true, rise: { floods: 2 } },
  /** A sunken arch over deep water: a wall to walkers and swimmers, passed under by a diver. */
  arch: { solid: true, low: true, swim: true, under: true },
  /** Dvergagröf's mountainside: grey broken stone. */
  scree: { solid: false },
  /** Ívaldi's Forge: iron-dark flags, and walls of black basalt. */
  forge_floor: { solid: false },
  forge_wall: { solid: true },
  /** Molten rock: no footing (arrows and the boomerang fly over it); Ís crusts it for a while. */
  lava: { solid: true, low: true, lava: true },
  /** Conveyor belts that carry anyone walking on them, the way they run. */
  belt_n: { solid: false, belt: 'n' },
  belt_e: { solid: false, belt: 'e' },
  belt_s: { solid: false, belt: 's' },
  belt_w: { solid: false, belt: 'w' },
  /** Hrímfjöll's wind-packed snow: firm going, no drifts on it. */
  firn: { solid: false },
  /** Glacier ice: a step onto it slides Ask on until a wall or the ice's edge. */
  glaze: { solid: false, glaze: true },
  /** Cliffs of blue rime. */
  rime: { solid: true },
  /** Hrímturn: a floor of frosted glass, and walls of rime-glass. */
  tower_floor: { solid: false },
  tower_wall: { solid: true },
  /** Clear ice: a wall to walkers and shots, but a beam of light shines through it. */
  clear_ice: { solid: true, clear: true },
  /** Útgarðr: flags the size of a farmhouse door, and walls of rime-bound blocks. */
  giant_floor: { solid: false },
  giant_wall: { solid: true },
} as const satisfies Record<TerrainId, TerrainDef>;
