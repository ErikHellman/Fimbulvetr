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
  tree: { solid: true },
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
  well: { solid: true },
  trough: { solid: true },
  /** The chopping block. */
  stump: { solid: true },
  bed: { solid: true },
  hearth: { solid: true },
  table: { solid: true },
  /** A standing stone. */
  menhir: { solid: true },
} as const satisfies Record<TerrainId, TerrainDef>;
