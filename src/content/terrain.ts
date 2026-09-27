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
] as const;
export type TerrainId = (typeof TERRAIN_IDS)[number];

export const TERRAIN = {
  grass: { solid: false },
  path: { solid: false },
  water: { solid: true },
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
} as const satisfies Record<TerrainId, TerrainDef>;
