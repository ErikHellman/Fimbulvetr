import type { EnemyId } from '@content/ids';
import type { Box } from '../../math/box';
import type { RngState } from '../../math/rng';
import type { Vec } from '../../math/vec';
import type { SimEvent } from '../../sim/events';
import type { SolidAt } from '../../world/collision';
import type { Tuning } from '../tuning';
import type { BehaviourId } from './index';

export interface EnemyDef {
  readonly id: EnemyId;
  readonly art: string;
  readonly hp: number;
  readonly body: Box;
  readonly hurt: Box;
  readonly behaviour: BehaviourId;
  /** 0 = full knockback, 1 = immovable. */
  readonly knockResist: number;
  /** Refills its health instead of dying (training dummy). */
  readonly immortal: boolean;
  /** Blocks the hero like a wall. */
  readonly solid: boolean;
  /** Damage dealt when the hero's hurt box touches this enemy's hurt box. */
  readonly touch?: ContactDamage;
  /** What it may leave behind when killed, as relative weights. */
  readonly drops?: DropTable;
}

/** Relative weights of what a killed enemy leaves: a heart (heals one heart), one silver, or nothing. */
export interface DropTable {
  readonly heart: number;
  readonly silver: number;
  readonly none: number;
}

export interface ContactDamage {
  /** Quarter hearts. */
  readonly amount: number;
  readonly knock: number;
  /** Hit tags (HEAVY, PIERCE_SHIELD). */
  readonly tags: number;
}

/** What an actor's behaviour may see and do each tick. */
export interface ActorCtx {
  readonly tuning: Tuning;
  /** The simulation's RNG: the only randomness behaviours may use. */
  readonly rng: RngState;
  /** The hero's feet position. */
  readonly hero: Readonly<Vec>;
  /** The hero's intended movement this tick (px per tick). */
  readonly heroVel: Readonly<Vec>;
  /** Wall lookup for the current screen (off-screen tiles are solid). */
  readonly solidAt: SolidAt;
  emit(event: SimEvent): void;
}
