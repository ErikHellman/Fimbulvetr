import { normalize, scale, sub } from '../../math/vec';
import { setAnim } from '../entity';
import type { Machine } from '../fsm';
import { distToHero, faceHero, justHit, steerTo, still } from './common';
import type { ActorCtx } from './defs';

export type MarbendillState = 'rise' | 'stalk' | 'tell' | 'grab' | 'recover' | 'flee';

/** A marbendill's numbers: px, px per tick and ticks. */
export const MARBENDILL = {
  riseTicks: 32,
  speed: 0.7,
  reach: 26,
  /** Hands reaching out, crouched to spring: 400 ms. */
  tellTicks: 24,
  grabTicks: 12,
  lungeSpeed: 2.4,
  recoverTicks: 40,
  /** Struck, it scrambles away towards the water for this long, its back open to the blade. */
  fleeTicks: 50,
  fleeSpeed: 1.2,
} as const;

/**
 * A marbendill, the merman of Sævatn: grey as a drowned man, weed for hair. It climbs out of the water,
 * creeps up, crouches with its hands out (the tell) and springs to grab, hauling Ask in towards the water
 * (its blow pulls rather than throws back). Struck, it scrambles away to the water with its back open,
 * then turns and comes again until it is driven off for good (its death: it dives and is gone).
 */
export const MARBENDILL_MACHINE: Machine<MarbendillState, ActorCtx> = {
  rise: {
    tick(e, c) {
      // The start state: `enter` does not run at spawn, so the pose is set here.
      setAnim(e, 'rise');
      still(e);
      e.iframes = Math.max(e.iframes, 2);
      faceHero(e, c);
      return e.fsm.t >= MARBENDILL.riseTicks - 1 ? 'stalk' : undefined;
    },
  },
  stalk: {
    enter(e) {
      setAnim(e, 'walk');
    },
    tick(e, c) {
      if (justHit(e)) return 'flee';
      if (distToHero(e, c) < MARBENDILL.reach) return 'tell';
      steerTo(e, c, c.hero, MARBENDILL.speed);
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
      if (justHit(e)) return 'flee';
      return e.fsm.t >= MARBENDILL.tellTicks - 1 ? 'grab' : undefined;
    },
  },
  grab: {
    enter(e, c) {
      setAnim(e, 'grab');
      const d = normalize(sub(c.hero, e.pos));
      e.vel = scale(d, MARBENDILL.lungeSpeed);
      c.emit({ t: 'sfx', id: 'sfx_seal' });
    },
    tick(e) {
      if (e.fsm.t >= 6) still(e);
      return e.fsm.t >= MARBENDILL.grabTicks - 1 ? 'recover' : undefined;
    },
  },
  recover: {
    enter(e) {
      still(e);
      setAnim(e, 'idle');
    },
    tick(e) {
      still(e);
      if (justHit(e)) return 'flee';
      return e.fsm.t >= MARBENDILL.recoverTicks - 1 ? 'stalk' : undefined;
    },
  },
  flee: {
    enter(e) {
      setAnim(e, 'walk');
    },
    tick(e, c) {
      const away = sub(e.pos, c.hero);
      const n = normalize(away.x === 0 && away.y === 0 ? { x: -1, y: 0 } : away);
      steerTo(e, c, { x: e.pos.x + n.x * 32, y: e.pos.y + n.y * 32 }, MARBENDILL.fleeSpeed);
      return e.fsm.t >= MARBENDILL.fleeTicks - 1 ? 'stalk' : undefined;
    },
  },
};
