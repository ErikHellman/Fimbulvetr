import { setAnim } from '../entity';
import type { Machine } from '../fsm';
import { distToHero, faceHero, justHit, roam, steerTo, still } from './common';
import type { ActorCtx } from './defs';

export type HaugbuiState = 'rise' | 'lurk' | 'stalk' | 'tell' | 'cut' | 'recover' | 'hurt';

/** Barrow-wight numbers: px, px per tick and ticks. */
export const HAUGBUI = {
  /** Climbing out of its mound, untouchable. */
  riseTicks: 40,
  sight: 120,
  lose: 200,
  /** Close enough to cut. */
  reach: 26,
  speed: 0.55,
  /** Blade raised over the shield: 400 ms. */
  tellTicks: 24,
  cutTicks: 10,
  /** Its guard is down while it cuts and recovers: the counter. */
  recoverTicks: 36,
  hurtTicks: 14,
} as const;

/**
 * A barrow-wight: an armoured draugr behind a round shield (`EnemyDef.shield`: blows from the front
 * clink off). It stalks Ask shield first, raises its blade (the telegraph) and cuts, and its guard is down
 * (`mem.open`) from the cut until it has recovered.
 */
export const HAUGBUI_MACHINE: Machine<HaugbuiState, ActorCtx> = {
  rise: {
    tick(e) {
      // The start state: `enter` does not run at spawn, so the pose is set here.
      setAnim(e, 'rise');
      e.iframes = Math.max(e.iframes, 2);
      return e.fsm.t >= HAUGBUI.riseTicks - 1 ? 'lurk' : undefined;
    },
  },
  lurk: {
    enter(e) {
      setAnim(e, 'walk');
    },
    tick(e, c) {
      if (justHit(e)) return 'hurt';
      if (distToHero(e, c) < HAUGBUI.sight) return 'stalk';
      roam(e, c, HAUGBUI.speed / 2, 32);
      setAnim(e, e.vel.x !== 0 || e.vel.y !== 0 ? 'walk' : 'idle');
      return undefined;
    },
  },
  stalk: {
    enter(e) {
      e.mem['open'] = 0;
      setAnim(e, 'walk');
    },
    tick(e, c) {
      if (justHit(e)) return 'hurt';
      const d = distToHero(e, c);
      if (d > HAUGBUI.lose) return 'lurk';
      if (d < HAUGBUI.reach) return 'tell';
      steerTo(e, c, c.hero, HAUGBUI.speed);
      faceHero(e, c);
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
      return e.fsm.t >= HAUGBUI.tellTicks - 1 ? 'cut' : undefined;
    },
  },
  cut: {
    enter(e, c) {
      e.mem['open'] = 1;
      setAnim(e, 'cut');
      c.emit({ t: 'sfx', id: 'sfx_swing' });
    },
    tick(e) {
      still(e);
      return e.fsm.t >= HAUGBUI.cutTicks - 1 ? 'recover' : undefined;
    },
  },
  recover: {
    enter(e) {
      e.mem['open'] = 1;
      setAnim(e, 'idle');
    },
    tick(e) {
      still(e);
      if (justHit(e)) return 'hurt';
      return e.fsm.t >= HAUGBUI.recoverTicks - 1 ? 'stalk' : undefined;
    },
  },
  hurt: {
    enter(e) {
      e.mem['open'] = 0;
      still(e);
      setAnim(e, 'hurt');
    },
    tick(e) {
      still(e);
      return e.fsm.t >= HAUGBUI.hurtTicks - 1 ? 'stalk' : undefined;
    },
  },
};
