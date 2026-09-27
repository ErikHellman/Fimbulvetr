import { setAnim } from '../entity';
import type { Machine } from '../fsm';
import { distToHero, faceHero, justHit, roam, steerTo, still } from './common';
import type { ActorCtx } from './defs';

export type DraugrState = 'rise' | 'lurk' | 'shamble' | 'tell' | 'swing' | 'recover' | 'hurt';

export const DRAUGR = {
  /** Climbing out of the ground on first sight, untouchable. */
  riseTicks: 40,
  sight: 128,
  lose: 200,
  reach: 30,
  speed: 0.5,
  /** Arms raised before the blow: 500 ms. */
  tellTicks: 30,
  swingTicks: 12,
  recoverTicks: 40,
  hurtTicks: 14,
} as const;

/**
 * Draugr rise from the ground, shamble after the hero, raise both arms (the telegraph) and bring them down
 * in a heavy blow that staggers through the shield: roll away or strike first.
 */
export const DRAUGR_MACHINE: Machine<DraugrState, ActorCtx> = {
  rise: {
    enter(e) {
      still(e);
      setAnim(e, 'rise');
    },
    tick(e) {
      e.iframes = Math.max(e.iframes, 2);
      return e.fsm.t >= DRAUGR.riseTicks - 1 ? 'lurk' : undefined;
    },
  },
  lurk: {
    enter(e) {
      setAnim(e, 'walk');
    },
    tick(e, c) {
      if (justHit(e)) return 'hurt';
      if (distToHero(e, c) < DRAUGR.sight) return 'shamble';
      roam(e, c, DRAUGR.speed / 2, 32);
      setAnim(e, e.vel.x !== 0 || e.vel.y !== 0 ? 'walk' : 'idle');
      return undefined;
    },
  },
  shamble: {
    enter(e) {
      setAnim(e, 'walk');
    },
    tick(e, c) {
      if (justHit(e)) return 'hurt';
      const d = distToHero(e, c);
      if (d > DRAUGR.lose) return 'lurk';
      if (d < DRAUGR.reach) return 'tell';
      steerTo(e, c, c.hero, DRAUGR.speed);
      return undefined;
    },
  },
  tell: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      setAnim(e, 'tell');
    },
    tick(e) {
      still(e);
      if (justHit(e)) return 'hurt';
      return e.fsm.t >= DRAUGR.tellTicks - 1 ? 'swing' : undefined;
    },
  },
  swing: {
    enter(e, c) {
      setAnim(e, 'swing');
      c.emit({ t: 'sfx', id: 'sfx_swing' });
    },
    tick(e) {
      still(e);
      return e.fsm.t >= DRAUGR.swingTicks - 1 ? 'recover' : undefined;
    },
  },
  recover: {
    enter(e) {
      setAnim(e, 'idle');
    },
    tick(e) {
      still(e);
      if (justHit(e)) return 'hurt';
      return e.fsm.t >= DRAUGR.recoverTicks - 1 ? 'shamble' : undefined;
    },
  },
  hurt: {
    enter(e) {
      still(e);
      setAnim(e, 'hurt');
    },
    tick(e) {
      still(e);
      return e.fsm.t >= DRAUGR.hurtTicks - 1 ? 'shamble' : undefined;
    },
  },
};
