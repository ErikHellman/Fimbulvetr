import type { FlagId } from '@content/flags';
import type { ItemId, ShopId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import type { Season } from '../clock/types';
import type { FlagValue } from '../state/flags';

/** Out-of-band requests (menus, shops, saves, dev tools), applied at the start of the next tick. */
export type Command =
  | { readonly t: 'warp'; readonly screen: ScreenId; readonly x: number; readonly y: number }
  | { readonly t: 'setMinute'; readonly minute: number }
  | { readonly t: 'setSeason'; readonly season: Season }
  | { readonly t: 'setFlag'; readonly flag: FlagId; readonly value: FlagValue }
  | { readonly t: 'buy'; readonly shop: ShopId; readonly item: ItemId }
  /** Puts an owned sub-item in item slot 0 (K) or 1 (L), or empties the slot; swaps if it was in the other. */
  | { readonly t: 'equip'; readonly slot: 0 | 1; readonly item: ItemId | null }
  /** Eats food (or drinks mead) from the pack. */
  | { readonly t: 'eat'; readonly item: ItemId }
  /** Dev: give items. */
  | { readonly t: 'give'; readonly item: ItemId; readonly n: number };
