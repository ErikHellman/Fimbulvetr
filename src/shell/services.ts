import type { Tileset } from '@art/tiles/tileset';
import type { WeatherKind } from '@core/clock/types';
import type { ContentDb } from '@core/sim/db';
import type { GameState } from '@core/state/gameState';
import type { DevTools } from './dev/bridge';
import type { ArtOverrides } from './gfx/atlases';
import type { FrameIndex } from './gfx/frameIndex';
import type { TouchControls } from './input/touch';
import type { SaveService } from './platform/saveService';
import type { Settings } from './platform/settings';

export interface Services {
  readonly db: ContentDb;
  readonly state: GameState;
  readonly settings: Settings;
  readonly saves: SaveService;
  readonly dev: DevTools | null;
  /** The on-screen controls and menu taps, shared by every scene. */
  readonly touch: TouchControls;
  /** Dev/test `?mute`. */
  readonly muted: boolean;
  /** Dev/test `?rolled=0` turns rolled weather and spawn tables off. */
  readonly rolled: boolean;
  /** Dev/test `?weather=`: the starting weather override. */
  readonly weather?: WeatherKind;
  /** The scene Boot hands over to: the title screen, straight into the game, or the dev texture gallery. */
  readonly start: 'title' | 'play' | 'gallery';
}

export interface RenderAssets {
  readonly frames: FrameIndex;
  readonly tileset: Tileset;
  /** What real art from `atlases/manifest.json` replaced at boot. */
  readonly overrides: ArtOverrides;
}

export interface PlayData extends Services {
  readonly assets: RenderAssets;
}
