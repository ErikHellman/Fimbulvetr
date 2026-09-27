import type { L10n } from '../i18n/t';

export interface GaldrDef {
  readonly name: L10n;
  readonly cost: number;
}

/** Where a dungeon item goes in its dungeon's saved state. */
export type DungeonGift = 'key' | 'bigKey' | 'map' | 'compass';

export interface ItemDef {
  readonly name: L10n;
  /** The line shown when it comes out of a chest (or a heart container is taken). */
  readonly found: L10n;
  /** Usable from an item slot (sub-items). */
  readonly slot: boolean;
  /** How many can be carried. */
  readonly max: number;
  /** Food and mead: quarter hearts healed when eaten from the menu. */
  readonly heal?: number;
  /** Dungeon items count in the current dungeon's state instead of the bag. */
  readonly dungeon?: DungeonGift;
  /** Hearts added to the maximum (heart containers); health refills. */
  readonly hearts?: number;
  /** Mead: seiðr restored when drunk from the menu. */
  readonly seidr?: number;
  /** Carried in a mead horn: all such items together never outnumber the horns. */
  readonly horn?: boolean;
  /** A seiðr vessel: the bar's maximum grows by this much (to 30) and fills. */
  readonly maxSeidr?: number;
  /** A larger purse: each one raises the silver cap a step (100 → 300 → 999). */
  readonly purse?: boolean;
}
