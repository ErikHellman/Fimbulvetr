import type { ScriptId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import type { Entity } from '../actors/entity';
import type { WeatherKind } from '../clock/types';
import type { Dir4 } from '../math/dir';
import type { Vec } from '../math/vec';
import type { GameState } from '../state/gameState';
import type { Cond } from '../story/cond';
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
  /** Collision from the terrain alone. */
  readonly base: CollisionGrid;
  /** `base` plus the tiles of closed fixtures (gates), restamped whenever one opens or closes. */
  readonly collision: CollisionGrid;
  readonly neighbours: Readonly<Record<Dir4, ScreenId | null>>;
  readonly cover: CoverGrid;
  /** The water level `collision` was stamped at, on screens with `water` (see systems/water.ts). */
  readonly level?: number;
}

/** What systems may read and change. `Sim` implements it; systems are plain functions over it. */
/** A running trial (the story step `trial`): play-ticks left of `of`, on `screen`. Never saved. */
export interface Trial {
  left: number;
  readonly of: number;
  readonly screen: ScreenId;
  readonly done: Cond;
  readonly win: ScriptId;
  readonly fail: ScriptId;
}

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
  /** Rolled weather and spawn tables are on (see `SimOptions.rolled`). */
  readonly rolled: boolean;
  /** Dev: the weather everywhere outdoors (undefined when off, so it never changes the hash). */
  weatherOverride?: WeatherKind;
  /** A trial against the sand (undefined when none, so it never changes the hash). */
  sand?: Trial;
  /** Dev: the hero takes no damage (undefined when off, so it never changes the hash). */
  god?: boolean;
  emit(event: SimEvent): void;
  newId(): number;
  load(id: ScreenId): LoadedScreen;
  /** A screen's parsed terrain (cached). */
  terrainOf(id: ScreenId): TerrainGrid;
}
