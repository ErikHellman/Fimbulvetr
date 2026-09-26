import type { EnemyId } from '@content/ids';
import type { Box } from '../../math/box';
import type { SimEvent } from '../../sim/events';
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
}

export interface EnemyCtx {
  readonly tuning: Tuning;
  emit(event: SimEvent): void;
}
