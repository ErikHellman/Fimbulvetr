import { setAnim } from '../entity';
import type { Machine } from '../fsm';
import { aim, distToHero, faceHero, justHit, lockAim, roam, steerTo, still, wallAhead } from './common';
import type { ActorCtx } from './defs';

export type VargrState = 'prowl' | 'stalk' | 'tell' | 'lunge' | 'recover' | 'hurt';

/** Wolf numbers: px, px per tick and ticks. */
export const VARGR = {
  sight: 112,
  lose: 176,
  reach: 44,
  prowlSpeed: 0.4,
  stalkSpeed: 0.9,
  /** The crouch before a lunge: 400 ms. */
  tellTicks: 24,
  lungeSpeed: 3.2,
  lungeTicks: 14,
  recoverTicks: 36,
  hurtTicks: 16,
} as const;

/**
 * Vargr prowl until they see the hero, stalk in close, crouch (the telegraph), lunge along a locked line,
 * then stand winded: the moment to strike back. A hit interrupts anything but the lunge.
 */
export const VARGR_MACHINE: Machine<VargrState, ActorCtx> = {
  prowl: {
    enter(e) {
      setAnim(e, 'walk');
    },
    tick(e, c) {
      if (justHit(e)) return 'hurt';
      if (distToHero(e, c) < VARGR.sight) return 'stalk';
      roam(e, c, VARGR.prowlSpeed, 48);
      setAnim(e, e.vel.x !== 0 || e.vel.y !== 0 ? 'walk' : 'idle');
      return undefined;
    },
  },
  stalk: {
    enter(e) {
      setAnim(e, 'walk');
    },
    tick(e, c) {
      if (justHit(e)) return 'hurt';
      const d = distToHero(e, c);
      if (d > VARGR.lose) return 'prowl';
      if (d < VARGR.reach) return 'tell';
      steerTo(e, c, c.hero, VARGR.stalkSpeed);
      return undefined;
    },
  },
  tell: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      setAnim(e, 'tell');
      c.emit({ t: 'sfx', id: 'sfx_growl' });
    },
    tick(e, c) {
      still(e);
      if (justHit(e)) return 'hurt';
      if (e.fsm.t < VARGR.tellTicks - 1) {
        faceHero(e, c);
        return undefined;
      }
      lockAim(e, c);
      return 'lunge';
    },
  },
  lunge: {
    enter(e) {
      setAnim(e, 'lunge');
    },
    tick(e, c) {
      const d = aim(e);
      if (wallAhead(e, c, d) || e.fsm.t >= VARGR.lungeTicks - 1) {
        still(e);
        return 'recover';
      }
      e.vel = { x: d.x * VARGR.lungeSpeed, y: d.y * VARGR.lungeSpeed };
      return undefined;
    },
  },
  recover: {
    enter(e) {
      still(e);
      setAnim(e, 'idle');
    },
    tick(e) {
      if (justHit(e)) return 'hurt';
      return e.fsm.t >= VARGR.recoverTicks - 1 ? 'stalk' : undefined;
    },
  },
  hurt: {
    enter(e) {
      still(e);
      setAnim(e, 'hurt');
    },
    tick(e) {
      still(e);
      return e.fsm.t >= VARGR.hurtTicks - 1 ? 'stalk' : undefined;
    },
  },
};
