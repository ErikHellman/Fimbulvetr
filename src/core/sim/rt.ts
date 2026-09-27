import type { ScreenId } from '@content/world/screens';
import type { Entity } from '../actors/entity';
import type { Dir4 } from '../math/dir';
import type { Vec } from '../math/vec';
import type { GameState } from '../state/gameState';
import type { StoryRun } from '../story/script';
import type { CollisionGrid } from '../world/collision';
import type { CoverGrid } from '../world/cover';
import type { TerrainGrid } from '../world/textmap';
import type { ContentDb } from './db';
import type { SimEvent } from './events';

/** `over`: the hero has fallen; the game waits for Continue. */
export type Mode = 'play' | 'transition' | 'story' | 'over';

/** Where and how the hero entered the current screen: Continue puts them back here. */
export interface Entry {
  readonly x: number;
  readonly y: number;
  readonly facing: Dir4;
}

/**
 * A screen change. `slide` (edge crossing) loads the new screen at t=0 and scrolls; `fade` (door) swaps
 * screen and hero at the midpoint while the picture is black.
 */
export interface Transition {
  readonly kind: 'slide' | 'fade';
  readonly from: ScreenId;
  readonly to: ScreenId;
  readonly dir: Dir4;
  t: number;
  readonly dur: number;
  readonly heroFrom: Vec;
  readonly heroTo: Vec;
  /** The hero's facing on arrival. */
  readonly facing: Dir4;
}

export interface LoadedScreen {
  readonly id: ScreenId;
  readonly terrain: TerrainGrid;
  readonly collision: CollisionGrid;
  readonly neighbours: Readonly<Record<Dir4, ScreenId | null>>;
  readonly cover: CoverGrid;
}

/** What systems may read and change. `Sim` implements it; systems are plain functions over it. */
export interface SimRt {
  readonly db: ContentDb;
  readonly state: GameState;
  readonly hero: Entity;
  mode: Mode;
  screen: LoadedScreen;
  /** Everything live on the screen except the hero. */
  actors: Entity[];
  transition: Transition | null;
  story: StoryRun | null;
  entry: Entry;
  emit(event: SimEvent): void;
  newId(): number;
  load(id: ScreenId): LoadedScreen;
}
