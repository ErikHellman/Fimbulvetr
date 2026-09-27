import type { ArmorId, WeaponId } from '@content/ids';
import type { Box } from '../math/box';
import type { Dir4 } from '../math/dir';

/** All numbers are per 60 Hz tick or pixels; damage and hp are quarter hearts. */
export interface HeroTuning {
  readonly walkSpeed: number;
  readonly shieldSpeed: number;
  readonly chargeSpeed: number;
  readonly rollSpeed: number;
  readonly rollTicks: number;
  readonly rollIframes: number;
  readonly rollCooldown: number;
  readonly attackTicks: number;
  readonly finisherTicks: number;
  readonly comboWindow: number;
  readonly swordActiveFrom: number;
  readonly swordActiveTo: number;
  readonly chargeTicks: number;
  readonly spinTicks: number;
  readonly hurtTicks: number;
  readonly hurtIframes: number;
  /** Length of the fall at 0 hp before the game-over panel shows. */
  readonly dyingTicks: number;
  /** Ticks of walking into a ledge before hopping it. */
  readonly ledgePushTicks: number;
  readonly hopTicks: number;
  /** Peak height (px) of the hop arc, drawn only. */
  readonly hopHeight: number;
  readonly liftTicks: number;
  readonly carrySpeed: number;
  readonly throwTicks: number;
  /** Height (px) a carried prop is held at. */
  readonly carryHeight: number;
  /** The throwing pose of a sub-item (the boomerang). */
  readonly tossTicks: number;
  readonly body: Box;
  readonly hurt: Box;
}

export interface SwordTuning {
  readonly comboDamage: readonly [number, number, number];
  readonly spinDamage: number;
  readonly knock: number;
  readonly boxes: Readonly<Record<Dir4, Box>>;
  readonly spinBox: Box;
}

export interface ThrowTuning {
  /** Horizontal speed, px per tick. */
  readonly speed: number;
  /** Ticks in the air before landing. */
  readonly flightTicks: number;
}

export interface PushTuning {
  /** Ticks of steady pushing before a block moves. */
  readonly ticks: number;
  /** Ticks a block takes to slide one tile. */
  readonly slideTicks: number;
}

export interface BoomerangTuning {
  /** px per tick, out and back. */
  readonly speed: number;
  /** px flown before it turns back (sooner at a wall or on a hit). */
  readonly range: number;
}

export interface Tuning {
  readonly hero: HeroTuning;
  readonly boomerang: BoomerangTuning;
  readonly throw: ThrowTuning;
  readonly push: PushTuning;
  /** Per-weapon swings; weapons not listed swing like `sword`. */
  readonly weapons: Readonly<Partial<Record<WeaponId, SwordTuning>>>;
  /** Share of each blow an armour takes off (rounded; a blow always deals at least 1). */
  readonly armor: Readonly<Record<ArmorId, { readonly reduce: number }>>;
  /** Typewriter speed, characters per second. */
  readonly textCps: number;
  readonly sword: SwordTuning;
  readonly enemyIframes: number;
  readonly knockDecay: number;
}

/** The swing of a weapon. */
export const swordOf = (t: Tuning, weapon?: WeaponId): SwordTuning =>
  (weapon === undefined ? undefined : t.weapons[weapon]) ?? t.sword;
