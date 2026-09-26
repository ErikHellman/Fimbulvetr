import type { ItemId, SfxId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import type { ClockEvent } from '../clock/types';
import type { Dir4 } from '../math/dir';

/** One-shot happenings of a tick. State is the truth; events only trigger effects (sound, particles, autosave). */
export type SimEvent =
  | { readonly t: 'sfx'; readonly id: SfxId }
  | { readonly t: 'hit'; readonly target: number; readonly blocked: boolean; readonly dealt: number }
  | { readonly t: 'screenTransition'; readonly from: ScreenId; readonly to: ScreenId; readonly dir: Dir4 }
  | { readonly t: 'screenEntered'; readonly screen: ScreenId }
  | { readonly t: 'clock'; readonly e: ClockEvent }
  | { readonly t: 'itemGet'; readonly item: ItemId }
  /** A safe moment to autosave: back in play after a screen change or a finished script. */
  | { readonly t: 'autosave' };
