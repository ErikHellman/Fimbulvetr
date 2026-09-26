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
  /** Ticks of walking into a ledge before hopping it. */
  readonly ledgePushTicks: number;
  readonly hopTicks: number;
  /** Peak height (px) of the hop arc, drawn only. */
  readonly hopHeight: number;
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

export interface Tuning {
  readonly hero: HeroTuning;
  /** Typewriter speed, characters per second. */
  readonly textCps: number;
  readonly sword: SwordTuning;
  readonly enemyIframes: number;
  readonly knockDecay: number;
}
