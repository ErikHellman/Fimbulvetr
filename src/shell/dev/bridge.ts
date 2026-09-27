import type { GameState } from '@core/state/gameState';
import type { SimEvent } from '@core/sim/events';
import type { Sim } from '@core/sim/sim';
import type { SaveService } from '@shell/platform/saveService';
import type { Settings } from '@shell/platform/settings';
import type { FrameIndex } from '@shell/gfx/frameIndex';
import type { FrameStats } from './stats';

/** What is drawn right now, summed over the screens on stage (two during a slide). */
export interface ViewStats {
  readonly screens: number;
  readonly decor: number;
  readonly animatedDecor: number;
  readonly animatedTiles: number;
  readonly emitters: number;
  readonly openWater: number;
  readonly fishAlive: number;
  readonly fishJumps: number;
  /**
   * Raindrops, snowflakes and blown leaves alive, lightning bolts so far, the darkness and fog drawn and
   * the lights cut out of the dark.
   */
  readonly rain: number;
  readonly snow: number;
  readonly leaves: number;
  readonly bolts: number;
  readonly dark: number;
  readonly fog: number;
  /** Burning cover tiles drawn. */
  readonly flames: number;
  readonly lights: number;
}

/** What the running Play scene exposes to dev tools. */
export interface DevBridge {
  readonly sim: Sim;
  readonly frames: FrameIndex;
  readonly stats: FrameStats;
  readonly settings: Settings;
  readonly saves: SaveService;
  appliedGrade(): readonly number[];
  lightLevel(): number;
  viewStats(): ViewStats;
  /** Makes a fish jump on the current screen right now, if it has open water. */
  jumpFish(): void;
  /** The tile index drawn at a cell of the current screen (animated tiles change over time). */
  tileAt(x: number, y: number): number;
  /** Restarts play from another state (used by import). */
  restart(state: GameState): void;
  /** The open pause menu's page and cursor, or null in play. */
  menu(): { readonly tab: string; readonly cursor: number; readonly confirm: boolean } | null;
}

export interface DevTools {
  attach(bridge: DevBridge): void;
  onEvents(events: readonly SimEvent[]): void;
}
