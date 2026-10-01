import type { FlagId } from '@content/flags';
import type { GaldrId, ItemId, ShopId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import type { Season, WeatherKind } from '../clock/types';
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
  /** Readies a known galdr for the galdr button (it moves to the front of those known). */
  | { readonly t: 'ready'; readonly galdr: GaldrId }
  /** Eats food (or drinks mead) from the pack. */
  | { readonly t: 'eat'; readonly item: ItemId }
  /** Dev: give items. */
  | { readonly t: 'give'; readonly item: ItemId; readonly n: number }
  /** Dev: set the hero's health (quarter hearts; 0 makes them fall). */
  | { readonly t: 'setHp'; readonly hp: number }
  /** Dev: the hero takes no damage. */
  | { readonly t: 'god'; readonly on: boolean }
  /** Dev: force the weather outdoors (null: back to the story's weather). */
  | { readonly t: 'weather'; readonly kind: WeatherKind | null }
  /** Dev: every enemy on the screen dies (the immortal ones refill). */
  | { readonly t: 'killAll' }
  /** The save-slot picker closed (a slot was written, or not): a waiting `save` step carries on. */
  | { readonly t: 'saved' };
