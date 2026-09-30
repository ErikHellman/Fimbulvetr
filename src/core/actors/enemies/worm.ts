import { add, scale } from '../../math/vec';
import { mem, setAnim } from '../entity';
import type { Machine } from '../fsm';
import { distToHero, faceHero, still, toHero } from './common';
import type { ActorCtx } from './defs';

export type WormState = 'under' | 'rise' | 'up' | 'sink';

/** Water-worm numbers: px and ticks. */
export const VATNORMR = {
  /** How near Ask must come before it surfaces. */
  sight: 128,
  /** Surfacing, head reared (the tell): 400 ms. */
  riseTicks: 24,
  /** Up and open to a blow after it spits. */
  upTicks: 40,
  sinkTicks: 12,
  /** Under the water before it may surface again. */
  restTicks: 90,
  /** The spit leaves its mouth this far up and ahead. */
  mouth: 8,
} as const;

/**
 * The water-worm lives in a pool and never leaves it. Under the water it is out of reach; when Ask comes
 * near it rears up (the tell), spits a gob of mud at them (the shield stops it) and stays up a while, open
 * to a blow from the bank or the boomerang's stun, before it sinks again.
 */
export const VATNORMR_MACHINE: Machine<WormState, ActorCtx> = {
  under: {
    enter(e) {
      setAnim(e, 'under');
      still(e);
    },
    tick(e, c) {
      // The start state: `enter` does not run at spawn, so the pose is set here.
      setAnim(e, 'under');
      still(e);
      e.iframes = Math.max(e.iframes, 2);
      const rest = mem(e, 'rest');
      if (rest > 0) {
        e.mem['rest'] = rest - 1;
        return undefined;
      }
      return distToHero(e, c) < VATNORMR.sight ? 'rise' : undefined;
    },
  },
  rise: {
    enter(e, c) {
      setAnim(e, 'tell');
      faceHero(e, c);
    },
    tick(e, c) {
      faceHero(e, c);
      return e.fsm.t >= VATNORMR.riseTicks ? 'up' : undefined;
    },
  },
  up: {
    enter(e, c) {
      setAnim(e, 'up');
      const d = toHero(e, c);
      c.shoot('spit', add(e.pos, scale(d, VATNORMR.mouth)), d);
    },
    tick(e) {
      return e.fsm.t >= VATNORMR.upTicks ? 'sink' : undefined;
    },
  },
  sink: {
    enter(e) {
      setAnim(e, 'sink');
    },
    tick(e) {
      if (e.fsm.t < VATNORMR.sinkTicks) return undefined;
      e.mem['rest'] = VATNORMR.restTicks;
      return 'under';
    },
  },
};
