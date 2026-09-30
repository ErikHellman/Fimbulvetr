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
] as const;
export type TerrainId = (typeof TERRAIN_IDS)[number];

export const TERRAIN = {
  grass: { solid: false },
  path: { solid: false },
  water: { solid: true, low: true },
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
  spring: { solid: true, low: true },
  /** A gravel shoal across a river: wadeable, slow, and under the spring flood (see COVER_DEFS.flood). */
  shoal: { solid: false, slow: 0.7 },
  /** Cut peat banks: dark, soft ground. */
  peat: { solid: false, slow: 0.9 },
  /** The drowned mill's roof standing out of its pond, four tiles wide and three deep. */
  mill: { solid: true, decor: { art: ['decor_mill'], w: 4, h: 3 } },
  /** Bárðr's ferry boat, moored at his landing, three tiles long. */
  boat: { solid: true, decor: { art: ['decor_boat'], w: 3, h: 1 } },
} as const satisfies Record<TerrainId, TerrainDef>;
