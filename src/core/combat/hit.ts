import type { Entity, Faction } from '../actors/entity';
import { DIR_VEC } from '../math/dir';
import { dot, scale, type Vec } from '../math/vec';

export type Element = 'none' | 'fire' | 'ice' | 'wind' | 'force' | 'holy';

/** Hit tags (bit flags). */
export const HEAVY = 1;
export const PIERCE_SHIELD = 2;
/** A thrown object (ravens only fear these). */
export const THROWN = 4;
/** Stuns an enemy that can be stunned (the boomerang). */
export const STUN = 8;
/** Pierces a foe's shield (the dash thrust). */
export const PIERCE = 16;

/** One damage path for swords, arrows, galdr, fire spread and traps. */
export interface HitData {
  readonly amount: number;
  readonly element: Element;
  readonly knock: number;
  /** Unit vector in the direction the hit travels (attacker → target). */
  readonly dir: Vec;
  readonly faction: Faction;
  readonly tags: number;
}

export interface HitOptions {
  readonly shielding: boolean;
  readonly iframes: number;
  readonly knockResist: number;
}

export interface HitResult {
  readonly outcome: 'ignored' | 'blocked' | 'damaged' | 'killed';
  readonly dealt: number;
}

const FLASH_TICKS = 12;

export function resolveHit(target: Entity, hit: HitData, options: HitOptions): HitResult {
  if (target.faction === hit.faction || target.iframes > 0) return { outcome: 'ignored', dealt: 0 };
  const knock = hit.knock * (1 - options.knockResist);
  const frontal = dot(hit.dir, DIR_VEC[target.facing]) < 0;
  if (options.shielding && frontal && (hit.tags & (HEAVY | PIERCE_SHIELD)) === 0) {
    target.knock = scale(hit.dir, knock / 2);
    return { outcome: 'blocked', dealt: 0 };
  }
  const dealt = Math.min(target.hp, hit.amount);
  target.hp -= dealt;
  target.iframes = options.iframes;
  target.flash = FLASH_TICKS;
  target.knock = scale(hit.dir, knock);
  return { outcome: target.hp <= 0 ? 'killed' : 'damaged', dealt };
}
