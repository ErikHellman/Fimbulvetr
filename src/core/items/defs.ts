import type { GaldrId, ItemId } from '@content/ids';
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
  /**
   * Ammunition (bombs): `max` more for each `bag` carried, and it stays in the bag and its slot at 0
   * once owned, so it can be refilled.
   */
  readonly ammo?: { readonly bag: ItemId; readonly step: number };
  /** A sub-item that spends another item as ammunition (the bow fires arrows); the HUD shows that count. */
  readonly fires?: ItemId;
  /** A rune-stave: from a slot it sings this galdr once, for no seiðr, and is used up. */
  readonly stave?: GaldrId;
  /** Given with it the first time (the bow comes with a full quiver). */
  readonly comes?: { readonly item: ItemId; readonly n: number };
}

/** How many of `id` can be carried now: its `max`, raised by each bag of an ammunition. */
export function itemMax(
  defs: Readonly<Record<ItemId, ItemDef>>,
  have: Readonly<Partial<Record<ItemId, number>>>,
  id: ItemId,
): number {
  const def = defs[id];
  return def.max + (def.ammo === undefined ? 0 : (have[def.ammo.bag] ?? 0) * def.ammo.step);
}

/** Owned at all: in the bag, even at a count of 0 (ammunition used up). */
export const owns = (have: Readonly<Partial<Record<ItemId, number>>>, id: ItemId): boolean =>
  Object.hasOwn(have, id);
