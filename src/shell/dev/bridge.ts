import type { GameState } from '@core/state/gameState';
import type { SimEvent } from '@core/sim/events';
import type { Sim } from '@core/sim/sim';
import type { SaveService } from '@shell/platform/saveService';
import type { Settings } from '@shell/platform/settings';
import type { FrameIndex } from '@shell/gfx/frameIndex';
import type { FrameStats } from './stats';

/** What the running Play scene exposes to dev tools. */
export interface DevBridge {
  readonly sim: Sim;
  readonly frames: FrameIndex;
  readonly stats: FrameStats;
  readonly settings: Settings;
  readonly saves: SaveService;
  appliedGrade(): readonly number[];
  lightLevel(): number;
  /** Restarts play from another state (used by import). */
  restart(state: GameState): void;
}

export interface DevTools {
  attach(bridge: DevBridge): void;
  onEvents(events: readonly SimEvent[]): void;
}
