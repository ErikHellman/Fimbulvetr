import type { FlagId } from '@content/flags';
import type { EnemyId, ItemId, PropId, ScriptId } from '@content/ids';
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
  /**
   * Carries a shield: blows from the front clink off, unless they pierce (the dash thrust), are heavy (a
   * blast), or land while its own guard is down (`mem.open`, set by its behaviour while it swings).
   */
  readonly shield?: boolean;
  /**
   * Hit tags that strike its weak spot while its behaviour has it `mem.exposed` (the King's crown, an
   * arrow): the hit sets `mem.struck` for the behaviour instead of clinking off.
   */
  readonly struckBy?: number;
  /** The element that breaks its `guard` for good (a bomb's force cracks a mud-crab's shell). */
  readonly cracks?: Element;
  /** Light enough for the grapple chain to drag it to Ask (who then finds it stunned). */
  readonly light?: true;
  /** Ticks a stunning hit (the boomerang) freezes it; absent = cannot be stunned. */
  readonly stunnable?: number;
  /**
   * A boss: named on the health bar. A `mini` boss (a key item's guard) shows the bar too, but its death
   * neither ends the dungeon's boss nor counts as the boss for the solver.
   */
  readonly boss?: { readonly name: L10n; readonly mini?: true };
  /** Items it cannot be beaten without (the progression solver checks them). */
  readonly needs?: readonly ItemId[];
  /** Turns into this prop at sunrise (a troll caught by daylight is a stone). */
  readonly petrify?: PropId;
  /** Elements that deal it double damage (a draugr burns). */
  readonly weak?: readonly Element[];
  /** On the wing: walls, water and ground cover do not stop or slow it (only the screen's edge does). */
  readonly flies?: boolean;
  /** Lives in the water and never leaves it (placed on a water tile; a water-worm). */
  readonly swims?: boolean;
  /** Gives off light in the dark, this many px around it (a bog-light). */
  readonly glow?: number;
  /**
   * A duel nobody dies in (Styrr's last lesson). Its death is a yield (its thing's `onDeath` runs, with
   * no drop); a blow that leaves Ask at one heart ends the duel instead: the foe leaves, Ask's hearts
   * refill, `flag` is cleared and `lost` runs. Leaving the screen clears `flag` too.
   */
  readonly duel?: { readonly flag: FlagId; readonly lost: ScriptId };
  /** Ticks a parry stuns it, overriding the default (a boss otherwise stands half as long). */
  readonly parryStun?: number;
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
  /** A few bombs (only while bombs are owned; otherwise nothing drops). */
  readonly bombs?: number;
  /** A few arrows (only while the bow is owned; otherwise nothing drops). */
  readonly arrows?: number;
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
  /** Whether a tile is open deep water (no ice, raft or wall on it): where swimmers go. */
  waterAt(tx: number, ty: number): boolean;
  /** Everything else live on the screen (pack members, bulbs, props). Read only. */
  readonly others: readonly Readonly<Entity>[];
  emit(event: SimEvent): void;
  /** Summons an enemy (a spike, a whelp); it acts from the next tick and never counts as a screen thing. */
  spawn(id: EnemyId, pos: Vec, facing: Dir4): Entity;
  /** Looses a shot (a gob of spit, an arrow, a returning axe) from `pos` along `dir`; `owner` catches an axe. */
  shoot(def: ShotId, pos: Vec, dir: Vec, owner?: number): void;
}

/**
 * Things enemies throw or spit: a water-worm's spit, a draugr's arrow, the Haugbúi King's spectral axe, a
 * rime bolt (M9: a frost wisp's or Hrímgerðr's, which the ice mirror turns).
 */
export type ShotId = 'spit' | 'arrow' | 'axe' | 'bolt';
