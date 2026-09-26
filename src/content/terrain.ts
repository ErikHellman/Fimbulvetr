import type { TerrainDef } from '@core/world/terrain';

export const TERRAIN_IDS = ['grass', 'path', 'water', 'rock', 'tree', 'ledge'] as const;
export type TerrainId = (typeof TERRAIN_IDS)[number];

export const TERRAIN = {
  grass: { solid: false },
  path: { solid: false },
  water: { solid: true },
  rock: { solid: true },
  tree: { solid: true },
  /** A low bank you can hop down (south) but not climb. */
  ledge: { solid: false, ledge: 's' },
} as const satisfies Record<TerrainId, TerrainDef>;
