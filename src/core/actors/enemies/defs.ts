import type { EnemyId, ItemId, PropId } from '@content/ids';
import type { L10n } from '../../i18n/t';
import type { Box } from '../../math/box';
import type { Dir4 } from '../../math/dir';
import type { RngState } from '../../math/rng';
import type { Vec } from '../../math/vec';
import type { Element } from '../../combat/hit';
import type { SimEvent } from '../../sim/events';
import type { SolidAt } from '../../world/collision';
import type { Entity } from '../entity';
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
  /**
   * Attack windows by state machine state: while the enemy is in that state and its state clock is in
   * `from`…`to`, the box for its facing hurts the hero. The ticks before `from` are the telegraph.
   */
  readonly attacks?: Readonly<Partial<Record<string, AttackWindow>>>;
  /** Armoured: every blow clinks off (a raid troll). Behaviours can also guard for a while (`mem.guard`). */
  readonly guard?: boolean;
  /** Ticks a stunning hit (the boomerang) freezes it; absent = cannot be stunned. */
  readonly stunnable?: number;
  /** A boss: named on the health bar. */
  readonly boss?: { readonly name: L10n };
  /** Items it cannot be beaten without (the progression solver checks them). */
  readonly needs?: readonly ItemId[];
  /** Turns into this prop at sunrise (a troll caught by daylight is a stone). */
  readonly petrify?: PropId;
  /** Elements that deal it double damage (a draugr burns). */
  readonly weak?: readonly Element[];
}

export interface AttackWindow {
  /** State-clock ticks (inclusive) during which the blow lands. */
  readonly from: number;
  readonly to: number;
  /** Hit boxes relative to the feet, by facing. */
  readonly boxes: Readonly<Record<Dir4, Box>>;
  /** Quarter hearts. */
  readonly amount: number;
  readonly knock: number;
  /** Hit tags (HEAVY staggers through the shield). */
  readonly tags: number;
}

/** Relative weights of what a killed enemy leaves: a heart (heals one heart), one silver, or nothing. */
export interface DropTable {
  readonly heart: number;
  readonly silver: number;
  /** A seiðr jar (two points of seiðr). */
  readonly seidr?: number;
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
  /** The hero's state machine state (`attack`, `roll`, `shield`…) and facing. */
  readonly heroFsm: string;
  readonly heroFacing: Dir4;
  /** Wall lookup for the current screen (off-screen tiles are solid). */
  readonly solidAt: SolidAt;
  /** Everything else live on the screen (pack members, bulbs, props). Read only. */
  readonly others: readonly Readonly<Entity>[];
  emit(event: SimEvent): void;
  /** Summons an enemy (a spike, a whelp); it acts from the next tick and never counts as a screen thing. */
  spawn(id: EnemyId, pos: Vec, facing: Dir4): Entity;
}
