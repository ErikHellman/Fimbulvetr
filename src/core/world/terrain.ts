import type { Dir4 } from '../math/dir';

/** How the rules see a terrain type. Looks are in src/art/tiles. */
export interface TerrainDef {
  readonly solid: boolean;
  /** A one-way ledge: solid, but the hero hops over it moving in this direction. */
  readonly ledge?: Dir4;
  /** Speed factor for anything standing on it (1 = normal). */
  readonly slow?: number;
}
