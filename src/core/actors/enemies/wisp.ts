import { length, normalize, scale } from '../../math/vec';
import { mem, setAnim } from '../entity';
import type { Machine } from '../fsm';
import { aim, distToHero, lockAim, still, toHero } from './common';
import type { ActorCtx } from './defs';

export type WispState = 'drift' | 'fade' | 'flare' | 'dart';

/** Bog-light numbers: px, px per tick and ticks. */
export const MYRLJOS = {
  /** It drifts toward Ask once they are this near. */
  sight: 160,
  driftSpeed: 0.45,
  /** It flares up when this close (three tiles). */
  flareAt: 48,
  /** Every so often it fades out and cannot be touched for a while. */
  fadeEvery: 180,
  fadeTicks: 60,
  /** The flare before the dart: 400 ms. */
  flareTicks: 24,
  dartSpeed: 3.5,
  dartTicks: 20,
  /** After a dart, before it may flare again. */
  restTicks: 90,
} as const;

/**
 * The bog-light: a cold flame over the fen at night, luring travellers off the path. It drifts toward
 * Ask, now and then fading out of reach; up close it flares bright (the tell) and darts along a locked
 * line. Two blows put it out.
 */
export const MYRLJOS_MACHINE: Machine<WispState, ActorCtx> = {
  drift: {
    enter(e) {
      setAnim(e, 'fly');
    },
    tick(e, c) {
      // The start state: `enter` does not run at spawn, so the pose is set here.
      setAnim(e, 'fly');
      const rest = mem(e, 'rest');
      if (rest > 0) e.mem['rest'] = rest - 1;
      const d = distToHero(e, c);
      if (rest === 0 && d < MYRLJOS.flareAt) return 'flare';
      if (e.fsm.t >= MYRLJOS.fadeEvery) return 'fade';
      if (d < MYRLJOS.sight && d > 4) e.vel = scale(toHero(e, c), MYRLJOS.driftSpeed);
      else still(e);
      return undefined;
    },
  },
  fade: {
    enter(e) {
      setAnim(e, 'fade');
      still(e);
    },
    tick(e) {
      e.iframes = Math.max(e.iframes, 2);
      return e.fsm.t >= MYRLJOS.fadeTicks ? 'drift' : undefined;
    },
  },
  flare: {
    enter(e, c) {
      setAnim(e, 'tell');
      still(e);
      lockAim(e, c);
    },
    tick(e, c) {
      if (e.fsm.t < MYRLJOS.flareTicks) {
        lockAim(e, c);
        return undefined;
      }
      return 'dart';
    },
  },
  dart: {
    enter(e) {
      setAnim(e, 'dart');
      const a = aim(e);
      e.vel = length(a) === 0 ? { x: 0, y: 0 } : scale(normalize(a), MYRLJOS.dartSpeed);
    },
    tick(e) {
      if (e.fsm.t < MYRLJOS.dartTicks) return undefined;
      still(e);
      e.mem['rest'] = MYRLJOS.restTicks;
      return 'drift';
    },
  },
};
