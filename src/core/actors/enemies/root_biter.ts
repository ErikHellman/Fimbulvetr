import { mem, setAnim } from '../entity';
import type { Machine } from '../fsm';
import { distToHero, faceHero, justHit, still } from './common';
import type { ActorCtx } from './defs';

export type RootBiterState = 'buried' | 'emerge' | 'bite' | 'up' | 'hurt' | 'retract';

export const ROOT_BITER = {
  /** It wakes when Ask's feet come this close. */
  sense: 48,
  /** Rearing out of the ground before it bites: 400 ms, the telegraph. */
  emergeTicks: 24,
  biteTicks: 10,
  /** Standing up after a bite, open to the blade. */
  upTicks: 60,
  /** Close enough at the end of `up` to rear and bite again at once. */
  again: 26,
  hurtTicks: 14,
  retractTicks: 12,
  /** Ticks underground before it can wake again. */
  restTicks: 60,
} as const;

const buriedIframes = (e: Parameters<typeof still>[0]): void => {
  e.iframes = Math.max(e.iframes, 2);
};

/**
 * A root-biter lies buried (untouchable) until Ask comes near, rears up (the tell), snaps, and then stands
 * up for a while, open to the blade, before it sinks again. It never moves from its spot.
 */
export const ROOT_BITER_MACHINE: Machine<RootBiterState, ActorCtx> = {
  buried: {
    enter(e) {
      still(e);
      setAnim(e, 'buried');
    },
    tick(e, c) {
      // The start state: `enter` does not run at spawn, so the pose is set here.
      setAnim(e, 'buried');
      still(e);
      buriedIframes(e);
      if (e.fsm.t < mem(e, 'rest')) return undefined;
      return distToHero(e, c) < ROOT_BITER.sense ? 'emerge' : undefined;
    },
  },
  emerge: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      setAnim(e, 'tell');
    },
    tick(e) {
      still(e);
      if (justHit(e)) return 'hurt';
      return e.fsm.t >= ROOT_BITER.emergeTicks - 1 ? 'bite' : undefined;
    },
  },
  bite: {
    enter(e, c) {
      setAnim(e, 'bite');
      c.emit({ t: 'sfx', id: 'sfx_growl' });
    },
    tick(e) {
      still(e);
      if (justHit(e)) return 'hurt';
      return e.fsm.t >= ROOT_BITER.biteTicks - 1 ? 'up' : undefined;
    },
  },
  up: {
    enter(e) {
      setAnim(e, 'idle');
    },
    tick(e, c) {
      still(e);
      if (justHit(e)) return 'hurt';
      faceHero(e, c);
      if (e.fsm.t < ROOT_BITER.upTicks - 1) return undefined;
      return distToHero(e, c) < ROOT_BITER.again ? 'emerge' : 'retract';
    },
  },
  hurt: {
    enter(e) {
      still(e);
      setAnim(e, 'hurt');
    },
    tick(e) {
      still(e);
      return e.fsm.t >= ROOT_BITER.hurtTicks - 1 ? 'retract' : undefined;
    },
  },
  retract: {
    enter(e) {
      still(e);
      setAnim(e, 'retract');
    },
    tick(e) {
      still(e);
      buriedIframes(e);
      if (e.fsm.t < ROOT_BITER.retractTicks - 1) return undefined;
      e.mem['rest'] = ROOT_BITER.restTicks;
      return 'buried';
    },
  },
};
