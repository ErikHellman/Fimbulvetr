import { scale } from '../../math/vec';
import { mem, setAnim } from '../entity';
import type { Machine } from '../fsm';
import { distToHero, faceHero, justHit, lockAim, aim, still, toHero } from './common';
import type { ActorCtx } from './defs';

export type MaraState = 'drift' | 'show' | 'leap' | 'recover' | 'ride' | 'thrown' | 'hurt';

/** Mara numbers: px, px per tick and ticks. */
export const MARA = {
  /** It drifts toward Ask once they are this near, unseen. */
  sight: 192,
  driftSpeed: 0.4,
  /** It shows itself (the tell) this close: three tiles. */
  showAt: 48,
  /** Visible and crouched before the leap: 400 ms. */
  showTicks: 24,
  leapSpeed: 2.6,
  leapTicks: 18,
  /** Within this of Ask's feet during the leap, it has them. */
  grab: 12,
  recoverTicks: 40,
  /** Thrown off by a roll: down and open to the blade. */
  thrownTicks: 90,
  hurtTicks: 14,
  /** Riding: one point of seiðr drained every this many ticks (see systems/mara.ts). */
  drainEvery: 60,
} as const;

const unseen = (e: Parameters<typeof still>[0]): void => {
  e.iframes = Math.max(e.iframes, 2);
};

/**
 * The mara: a night-hag of the fog marsh. Unseen, it drifts after Ask until three tiles away (or lit by
 * Ljós, `mem.lit`), shows itself crouched (the tell) and leaps. If it lands on Ask it rides them,
 * draining seiðr, until a roll throws it off; thrown, it lies open to the blade for a while.
 */
export const MARA_MACHINE: Machine<MaraState, ActorCtx> = {
  drift: {
    enter(e) {
      setAnim(e, 'hide');
    },
    tick(e, c) {
      // The start state: `enter` does not run at spawn, so the pose is set here.
      setAnim(e, 'hide');
      unseen(e);
      const d = distToHero(e, c);
      if (d < MARA.showAt || mem(e, 'lit') === 1) return 'show';
      if (d < MARA.sight && d > 4) e.vel = scale(toHero(e, c), MARA.driftSpeed);
      else still(e);
      return undefined;
    },
  },
  show: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      setAnim(e, 'tell');
      c.emit({ t: 'sfx', id: 'sfx_shriek' });
    },
    tick(e, c) {
      still(e);
      if (justHit(e)) return 'hurt';
      if (e.fsm.t < MARA.showTicks - 1) return undefined;
      lockAim(e, c);
      return 'leap';
    },
  },
  leap: {
    enter(e) {
      setAnim(e, 'leap');
    },
    tick(e, c) {
      if (justHit(e)) return 'hurt';
      e.vel = scale(aim(e), MARA.leapSpeed);
      if (distToHero(e, c) < MARA.grab && c.heroFsm !== 'roll') return 'ride';
      return e.fsm.t >= MARA.leapTicks - 1 ? 'recover' : undefined;
    },
  },
  recover: {
    enter(e) {
      still(e);
      setAnim(e, 'idle');
    },
    tick(e) {
      still(e);
      if (justHit(e)) return 'hurt';
      return e.fsm.t >= MARA.recoverTicks - 1 ? 'drift' : undefined;
    },
  },
  ride: {
    enter(e, c) {
      setAnim(e, 'ride');
      c.emit({ t: 'sfx', id: 'sfx_shriek' });
    },
    tick(e, c) {
      // On Ask's back: out of the blade's reach, until a roll throws it off.
      unseen(e);
      still(e);
      e.pos = { x: c.hero.x, y: c.hero.y + 1 };
      e.facing = c.heroFacing;
      return c.heroFsm === 'roll' ? 'thrown' : undefined;
    },
  },
  thrown: {
    enter(e, c) {
      e.vel = scale(toHero(e, c), -1.5);
      setAnim(e, 'down');
    },
    tick(e) {
      if (e.fsm.t > 8) still(e);
      if (justHit(e)) return 'hurt';
      return e.fsm.t >= MARA.thrownTicks - 1 ? 'drift' : undefined;
    },
  },
  hurt: {
    enter(e) {
      still(e);
      setAnim(e, 'hurt');
    },
    tick(e) {
      still(e);
      return e.fsm.t >= MARA.hurtTicks - 1 ? 'recover' : undefined;
    },
  },
};
