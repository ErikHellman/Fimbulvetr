import type { SimEvent } from '@core/sim/events';
import type { Sim } from '@core/sim/sim';
import type { Settings } from '@shell/platform/settings';
import type { FrameIndex } from '@shell/gfx/frameIndex';
import type { FrameStats } from './stats';

/** What the running Play scene exposes to dev tools. Extended by later tasks (saves). */
export interface DevBridge {
  readonly sim: Sim;
  readonly frames: FrameIndex;
  readonly stats: FrameStats;
  readonly settings: Settings;
  appliedGrade(): readonly number[];
  lightLevel(): number;
}

export interface DevTools {
  attach(bridge: DevBridge): void;
  onEvents(events: readonly SimEvent[]): void;
}
