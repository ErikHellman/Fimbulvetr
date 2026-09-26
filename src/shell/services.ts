import type { Tileset } from '@art/tiles/tileset';
import type { ContentDb } from '@core/sim/db';
import type { GameState } from '@core/state/gameState';
import type { FrameIndex } from './gfx/frameIndex';

/** What main.ts hands to the scenes. Later tasks add settings, saves and dev tools. */
export interface Services {
  readonly db: ContentDb;
  readonly state: GameState;
}

export interface RenderAssets {
  readonly frames: FrameIndex;
  readonly tileset: Tileset;
}

export interface PlayData extends Services {
  readonly assets: RenderAssets;
}
