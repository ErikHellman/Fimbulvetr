import { DIR_VEC } from '../../math/dir';
import { dot, sub } from '../../math/vec';
import { setAnim } from '../entity';
import type { Machine } from '../fsm';
import { distToHero, faceHero, justHit, steerTo, still } from './common';
import type { ActorCtx } from './defs';

export type FogDraugrState = 'hidden' | 'rise' | 'stalk' | 'tell' | 'swing' | 'recover' | 'sink' | 'hurt';

export const FOG_DRAUGR = {
  /** It rises when Ask passes this near with their back to it… */
  sense: 72,
  /** …or comes this close, whichever way they face. */
  near: 24,
  riseTicks: 30,
  speed: 0.6,
  reach: 30,
  /** Further than this and it sinks back into the fog. */
  lose: 220,
  /** The blade raised: 400 ms. */
  tellTicks: 24,
  swingTicks: 10,
  recoverTicks: 36,
  sinkTicks: 30,
  hurtTicks: 14,
} as const;

const untouchable = (e: Parameters<typeof still>[0]): void => {
  e.iframes = Math.max(e.iframes, 2);
};

/**
 * A fog-draugr lies sunk in the mist as a faint swirl until Ask walks past it with their back turned,
 * then rises behind them, stalks, raises its blade (the tell) and cuts. Lose it and it sinks again.
 */
export const FOG_DRAUGR_MACHINE: Machine<FogDraugrState, ActorCtx> = {
  hidden: {
    enter(e) {
      still(e);
      setAnim(e, 'hide');
    },
    tick(e, c) {
      // The start state: `enter` does not run at spawn, so the pose is set here.
      setAnim(e, 'hide');
      still(e);
      untouchable(e);
      const d = distToHero(e, c);
      const behind = dot(DIR_VEC[c.heroFacing], sub(e.pos, c.hero)) < 0;
      return d < FOG_DRAUGR.near || (d < FOG_DRAUGR.sense && behind) ? 'rise' : undefined;
    },
  },
  rise: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      setAnim(e, 'rise');
      c.emit({ t: 'sfx', id: 'sfx_wake' });
    },
    tick(e) {
      still(e);
      untouchable(e);
      return e.fsm.t >= FOG_DRAUGR.riseTicks - 1 ? 'stalk' : undefined;
    },
  },
  stalk: {
    enter(e) {
      setAnim(e, 'walk');
    },
    tick(e, c) {
      if (justHit(e)) return 'hurt';
      const d = distToHero(e, c);
      if (d > FOG_DRAUGR.lose) return 'sink';
      if (d < FOG_DRAUGR.reach) return 'tell';
      steerTo(e, c, c.hero, FOG_DRAUGR.speed);
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
      return e.fsm.t >= FOG_DRAUGR.tellTicks - 1 ? 'swing' : undefined;
    },
  },
  swing: {
    enter(e, c) {
      setAnim(e, 'swing');
      c.emit({ t: 'sfx', id: 'sfx_swing' });
    },
    tick(e) {
      still(e);
      return e.fsm.t >= FOG_DRAUGR.swingTicks - 1 ? 'recover' : undefined;
    },
  },
  recover: {
    enter(e) {
      setAnim(e, 'idle');
    },
    tick(e) {
      still(e);
      if (justHit(e)) return 'hurt';
      return e.fsm.t >= FOG_DRAUGR.recoverTicks - 1 ? 'stalk' : undefined;
    },
  },
  sink: {
    enter(e) {
      still(e);
      setAnim(e, 'rise');
    },
    tick(e) {
      still(e);
      untouchable(e);
      return e.fsm.t >= FOG_DRAUGR.sinkTicks - 1 ? 'hidden' : undefined;
    },
  },
  hurt: {
    enter(e) {
      still(e);
      setAnim(e, 'hurt');
    },
    tick(e) {
      still(e);
      return e.fsm.t >= FOG_DRAUGR.hurtTicks - 1 ? 'stalk' : undefined;
    },
  },
};
