import type { Tileset } from '@art/tiles/tileset';
import type { ContentDb } from '@core/sim/db';
import type { GameState } from '@core/state/gameState';
import type { DevTools } from './dev/bridge';
import type { FrameIndex } from './gfx/frameIndex';
import type { Settings } from './platform/settings';

/** What main.ts hands to the scenes. Later tasks add saves. */
export interface Services {
  readonly db: ContentDb;
  readonly state: GameState;
  readonly settings: Settings;
  readonly dev: DevTools | null;
  /** Dev/test `?mute`. */
  readonly muted: boolean;
}

export interface RenderAssets {
  readonly frames: FrameIndex;
  readonly tileset: Tileset;
}

export interface PlayData extends Services {
  readonly assets: RenderAssets;
}
