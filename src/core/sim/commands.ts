import type { FlagId } from '@content/flags';
import type { ScreenId } from '@content/world/screens';
import type { Season } from '../clock/types';
import type { FlagValue } from '../state/flags';

/** Out-of-band requests (menus, shops, saves, dev tools), applied at the start of the next tick. */
export type Command =
  | { readonly t: 'warp'; readonly screen: ScreenId; readonly x: number; readonly y: number }
  | { readonly t: 'setMinute'; readonly minute: number }
  | { readonly t: 'setSeason'; readonly season: Season }
  | { readonly t: 'setFlag'; readonly flag: FlagId; readonly value: FlagValue };
