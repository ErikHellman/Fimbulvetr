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
  /** Deep water a swimmer crosses (with the seal-skin): `buildCollision` marks it `DEEP`. */
  readonly swim?: boolean;
  /** A sunken arch over deep water (M7b): a wall to a swimmer, passed under by a diver. */
  readonly under?: boolean;
  /** A current that pushes a swimmer this way. */
  readonly current?: Dir4;
  /** A surge: it pushes harder than anyone swims, and passes over a diver. */
  readonly strong?: boolean;
  /** A conveyor belt (M8): it carries anyone walking on it this way. */
  readonly belt?: Dir4;
  /** Molten rock (M8): no footing; Ís crusts it over for a while (see systems/is.ts). */
  readonly lava?: boolean;
}

/** How a terrain answers the water level: flooded from level `floods` up, or afloat from `floats` up. */
export interface TerrainRise {
  readonly floods?: 1 | 2;
  readonly floats?: 1 | 2;
}
