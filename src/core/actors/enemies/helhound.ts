import { mem, setAnim } from '../entity';
import type { Machine } from '../fsm';
import { aim, distToHero, faceHero, justHit, lockAim, roam, steerTo, still, wallAhead } from './common';
import type { ActorCtx } from './defs';

export type HelhoundState = 'prowl' | 'stalk' | 'tell' | 'lunge' | 'recover' | 'hurt';

/** Hel-hound numbers: px, px per tick and ticks. */
export const HELHOUND = {
  sight: 128,
  lose: 192,
  reach: 48,
  prowlSpeed: 0.5,
  stalkSpeed: 1.1,
  /** The crouch before a lunge: 333 ms. */
  tellTicks: 20,
  /** A packmate joining a crouch lunges this much later, so the pair's lunges come one after the other. */
  pairLag: 14,
  lungeSpeed: 3.6,
  lungeTicks: 14,
  recoverTicks: 30,
  hurtTicks: 14,
} as const;

/** Whether another hel-hound on the screen has just begun its crouch. */
const packmateCrouching = (c: ActorCtx, self: number): boolean =>
  c.others.some((o) => o.id !== self && o.def === 'helhound' && o.fsm.s === 'tell' && mem(o, 'pair') === 0);

/**
 * Hel-hounds hunt in pairs: they stalk like vargr, and when one crouches to lunge, any packmate in sight
 * crouches with it and lunges a beat later, so the second bite comes as Ask dodges the first. Light enough
 * for the grapple to drag.
 */
export const HELHOUND_MACHINE: Machine<HelhoundState, ActorCtx> = {
  prowl: {
    enter(e) {
      setAnim(e, 'walk');
    },
    tick(e, c) {
      if (justHit(e)) return 'hurt';
      if (distToHero(e, c) < HELHOUND.sight) return 'stalk';
      roam(e, c, HELHOUND.prowlSpeed, 48);
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
      if (d > HELHOUND.lose) return 'prowl';
      if (d < HELHOUND.sight && packmateCrouching(c, e.id)) {
        e.mem['pair'] = 1;
        return 'tell';
      }
      if (d < HELHOUND.reach) {
        e.mem['pair'] = 0;
        return 'tell';
      }
      steerTo(e, c, c.hero, HELHOUND.stalkSpeed);
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
      const ticks = HELHOUND.tellTicks + (mem(e, 'pair') === 1 ? HELHOUND.pairLag : 0);
      if (e.fsm.t < ticks - 1) {
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
      if (wallAhead(e, c, d) || e.fsm.t >= HELHOUND.lungeTicks - 1) {
        still(e);
        return 'recover';
      }
      e.vel = { x: d.x * HELHOUND.lungeSpeed, y: d.y * HELHOUND.lungeSpeed };
      return undefined;
    },
  },
  recover: {
    enter(e) {
      still(e);
      e.mem['pair'] = 0;
      setAnim(e, 'idle');
    },
    tick(e) {
      if (justHit(e)) return 'hurt';
      return e.fsm.t >= HELHOUND.recoverTicks - 1 ? 'stalk' : undefined;
    },
  },
  hurt: {
    enter(e) {
      still(e);
      setAnim(e, 'hurt');
    },
    tick(e) {
      still(e);
      return e.fsm.t >= HELHOUND.hurtTicks - 1 ? 'stalk' : undefined;
    },
  },
};
