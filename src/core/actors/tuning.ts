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
  /** Singing a galdr: the hero stands still this long. */
  readonly castTicks: number;
  /** A blow that meets the shield within this many ticks of raising it is parried (with the lesson). */
  readonly parryTicks: number;
  /** Ticks a parried foe stands stunned (a boss half as long). */
  readonly parryStun: number;
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

/** The Eldr galdr's bolt of fire. */
export interface EldrTuning {
  /** px per tick. */
  readonly speed: number;
  /** px flown before it gutters out. */
  readonly range: number;
  /** Quarter hearts to a foe (halved in the rain). */
  readonly damage: number;
}

/** Burning ground cover. */
export interface FireTuning {
  /** Ticks a tile burns before it is ash. */
  readonly burnTicks: number;
  /** When a burning tile has this many ticks left it catches its neighbours. */
  readonly spreadAt: number;
  /** Quarter hearts dealt to what stands in the flames (through the shield). */
  readonly amount: number;
  readonly knock: number;
  /** Ticks between two scorches of the same foe. */
  readonly scorch: number;
}

/** The dash thrust: a roll turned into a lunge (Styrr's lesson). */
export interface ThrustTuning {
  /** Roll ticks before the sword may turn it into a thrust. */
  readonly from: number;
  readonly ticks: number;
  /** px per tick. */
  readonly speed: number;
  /** Its blow is this many times the first swing's. */
  readonly damageMul: number;
  /** Hit boxes relative to the feet, by facing: longer and narrower than a swing. */
  readonly boxes: Readonly<Record<Dir4, Box>>;
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
  readonly fire: FireTuning;
  readonly eldr: EldrTuning;
  /** Share of each blow an armour takes off (rounded; a blow always deals at least 1). */
  readonly armor: Readonly<Record<ArmorId, { readonly reduce: number }>>;
  /** Typewriter speed, characters per second. */
  readonly textCps: number;
  readonly sword: SwordTuning;
  readonly thrust: ThrustTuning;
  readonly enemyIframes: number;
  readonly knockDecay: number;
}

/** The swing of a weapon. */
export const swordOf = (t: Tuning, weapon?: WeaponId): SwordTuning =>
  (weapon === undefined ? undefined : t.weapons[weapon]) ?? t.sword;
