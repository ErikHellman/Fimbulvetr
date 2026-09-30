import type { EnemyId, ItemId, SfxId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import type { ClockEvent } from '../clock/types';
import type { Dir4 } from '../math/dir';

/** One-shot happenings of a tick. State is the truth; events only trigger effects (sound, particles, autosave). */
export type SimEvent =
  | { readonly t: 'sfx'; readonly id: SfxId }
  | { readonly t: 'hit'; readonly target: number; readonly blocked: boolean; readonly dealt: number }
  /** An enemy died at world-screen pixel (x, y) and was removed. */
  | {
      readonly t: 'killed';
      readonly id: number;
      readonly def: EnemyId;
      readonly x: number;
      readonly y: number;
    }
  | { readonly t: 'screenTransition'; readonly from: ScreenId; readonly to: ScreenId; readonly dir: Dir4 }
  | { readonly t: 'screenEntered'; readonly screen: ScreenId }
  | { readonly t: 'clock'; readonly e: ClockEvent }
  | { readonly t: 'itemGet'; readonly item: ItemId }
  /** Ground cover on the screen was cut or regrew; redraw its layer. */
  | { readonly t: 'coverChanged'; readonly screen: ScreenId }
  /** A safe moment to autosave: back in play after a screen change or a finished script. */
  | { readonly t: 'autosave' }
  /** The hero's fall has ended: show the game-over panel (Continue after `CONTINUE_DELAY`). */
  | { readonly t: 'gameOver' }
  /** The screen should shake (a boss stamping or falling); the shell honours the shake setting. */
  | { readonly t: 'shake'; readonly amount: number }
  /** The boss of the room has fallen (its summons went with it). */
  | { readonly t: 'bossDead' }
  /** A bomb went off at (x, y) on the current screen. */
  | { readonly t: 'blast'; readonly x: number; readonly y: number };
