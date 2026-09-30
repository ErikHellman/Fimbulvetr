import { setAnim } from '../entity';
import type { Machine } from '../fsm';
import { distToHero, faceHero, justHit, roam, steerTo, still } from './common';
import type { ActorCtx } from './defs';

export type LeirkrabbiState = 'sidle' | 'tell' | 'pinch' | 'recover' | 'hurt';

/** Mud-crab numbers: px, px per tick and ticks. */
export const LEIRKRABBI = {
  sight: 96,
  /** Close enough to pinch. */
  reach: 24,
  /** It keeps this far to Ask's side as it closes in, claws first. */
  side: 16,
  speed: 0.55,
  roamSpeed: 0.3,
  /** Claws raised: 400 ms. */
  tellTicks: 24,
  pinchTicks: 10,
  recoverTicks: 30,
  hurtTicks: 14,
} as const;

/**
 * A mud-crab sidles in toward Ask's flank, raises its claws (the telegraph) and pinches, then rests. Its
 * shell turns every blow (`guard`) until a blast cracks it (`cracks: 'force'`); a real hit interrupts
 * anything but the pinch.
 */
export const LEIRKRABBI_MACHINE: Machine<LeirkrabbiState, ActorCtx> = {
  sidle: {
    enter(e) {
      setAnim(e, 'walk');
    },
    tick(e, c) {
      if (justHit(e)) return 'hurt';
      const d = distToHero(e, c);
      if (d > LEIRKRABBI.sight) {
        roam(e, c, LEIRKRABBI.roamSpeed, 32);
      } else {
        if (d < LEIRKRABBI.reach) return 'tell';
        const flank = e.pos.x < c.hero.x ? -LEIRKRABBI.side : LEIRKRABBI.side;
        steerTo(e, c, { x: c.hero.x + flank, y: c.hero.y }, LEIRKRABBI.speed);
        faceHero(e, c);
      }
      setAnim(e, e.vel.x !== 0 || e.vel.y !== 0 ? 'walk' : 'idle');
      return undefined;
    },
  },
  tell: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      setAnim(e, 'tell');
    },
    tick(e, c) {
      still(e);
      if (justHit(e)) return 'hurt';
      if (e.fsm.t < LEIRKRABBI.tellTicks - 1) return undefined;
      faceHero(e, c);
      return 'pinch';
    },
  },
  pinch: {
    enter(e) {
      still(e);
      setAnim(e, 'pinch');
    },
    tick(e) {
      still(e);
      return e.fsm.t >= LEIRKRABBI.pinchTicks - 1 ? 'recover' : undefined;
    },
  },
  recover: {
    enter(e) {
      still(e);
      setAnim(e, 'idle');
    },
    tick(e) {
      if (justHit(e)) return 'hurt';
      return e.fsm.t >= LEIRKRABBI.recoverTicks - 1 ? 'sidle' : undefined;
    },
  },
  hurt: {
    enter(e) {
      still(e);
      setAnim(e, 'hurt');
    },
    tick(e) {
      still(e);
      return e.fsm.t >= LEIRKRABBI.hurtTicks - 1 ? 'sidle' : undefined;
    },
  },
};
