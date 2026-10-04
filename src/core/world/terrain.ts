import type { Dir4 } from '../math/dir';

/**
 * An object drawn as one y-sorted sprite over a `w`×`h` block of solid tiles (a tree, a well, a bed).
 * `art` lists the sprite keys to choose from per block; frames are `<art>_idle_s_<n>`.
 */
export interface DecorDef {
  readonly art: readonly string[];
  readonly w: number;
  readonly h: number;
}

/** How the rules see a terrain type. Looks are in src/art/tiles. */
export interface TerrainDef {
  readonly solid: boolean;
  /** Present for object terrains: the shell draws a sprite per block instead of relying on the tile. */
  readonly decor?: DecorDef;
  /** A one-way ledge: solid, but the hero hops over it moving in this direction. */
  readonly ledge?: Dir4;
  /** Speed factor for anything standing on it (1 = normal). */
  readonly slow?: number;
  /** Solid underfoot but open above (water, sap): the boomerang flies over it. */
  readonly low?: boolean;
  /** Hidden floor: sound underfoot, but drawn as what it spans; only light shows it (see world/ghost.ts). */
  readonly hidden?: boolean;
  /** Its footing follows the screen's water level (see world/water.ts); the terrain itself is as at level 0. */
  readonly rise?: TerrainRise;
}

/** How a terrain answers the water level: flooded from level `floods` up, or afloat from `floats` up. */
export interface TerrainRise {
  readonly floods?: 1 | 2;
  readonly floats?: 1 | 2;
}
