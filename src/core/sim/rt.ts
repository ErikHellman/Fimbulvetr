import type { ScreenId } from '@content/world/screens';
import type { Entity } from '../actors/entity';
import type { Dir4 } from '../math/dir';
import type { Vec } from '../math/vec';
import type { GameState } from '../state/gameState';
import type { CollisionGrid } from '../world/collision';
import type { TerrainGrid } from '../world/textmap';
import type { ContentDb } from './db';
import type { SimEvent } from './events';

export type Mode = 'play' | 'transition';

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
  emit(event: SimEvent): void;
  newId(): number;
  load(id: ScreenId): LoadedScreen;
}
