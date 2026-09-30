import { DIR_VEC } from '../../math/dir';
import { scale } from '../../math/vec';
import { mem, setAnim } from '../entity';
import type { Machine } from '../fsm';
import { distToHero, faceHero, justHit, steerTo, still, wallAhead } from './common';
import type { ActorCtx } from './defs';

export type HaugvordrState = 'stand' | 'advance' | 'tell' | 'sweep' | 'brace' | 'bash' | 'dazed' | 'recover';

/** Barrow-warden numbers: px, px per tick and ticks. */
export const HAUGVORDR = {
  wake: 112,
  speed: 0.45,
  /** Close enough to sweep its blade. */
  reach: 30,
  /** Far enough, and it braces its shield (500 ms) and bashes forward in a line until a wall stops it. */
  bashFrom: 56,
  bashEvery: 150,
  sweepTell: 24,
  sweepTicks: 10,
  braceTicks: 30,
  bashSpeed: 3,
  bashTicks: 120,
  dazedTicks: 90,
  recoverTicks: 36,
} as const;

/**
 * Haugvörðr, the barrow-warden (D3's mini-boss): a giant wight behind a great shield (`EnemyDef.shield`),
 * guarding the bow. Close in, it raises its blade (the tell) and sweeps; further off it braces behind its
 * shield (the tell) and bashes forward in a straight line. A bash that meets a wall leaves it dazed, its
 * guard down on every side (`mem.open`); its blade out and its recovery leave it open too.
 */
export const HAUGVORDR_MACHINE: Machine<HaugvordrState, ActorCtx> = {
  stand: {
    tick(e, c) {
      setAnim(e, 'idle');
      still(e);
      return distToHero(e, c) < HAUGVORDR.wake ? 'advance' : undefined;
    },
  },
  advance: {
    enter(e) {
      e.mem['open'] = 0;
      setAnim(e, 'walk');
    },
    tick(e, c) {
      const d = distToHero(e, c);
      e.mem['bashCd'] = Math.max(0, mem(e, 'bashCd') - 1);
      if (d < HAUGVORDR.reach) return 'tell';
      if (d > HAUGVORDR.bashFrom && mem(e, 'bashCd') === 0 && e.fsm.t > 30) return 'brace';
      steerTo(e, c, c.hero, HAUGVORDR.speed);
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
      return e.fsm.t >= HAUGVORDR.sweepTell - 1 ? 'sweep' : undefined;
    },
  },
  sweep: {
    enter(e, c) {
      e.mem['open'] = 1;
      setAnim(e, 'sweep');
      c.emit({ t: 'sfx', id: 'sfx_swing' });
    },
    tick(e) {
      still(e);
      return e.fsm.t >= HAUGVORDR.sweepTicks - 1 ? 'recover' : undefined;
    },
  },
  brace: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      setAnim(e, 'brace');
      c.emit({ t: 'sfx', id: 'sfx_growl' });
    },
    tick(e) {
      still(e);
      return e.fsm.t >= HAUGVORDR.braceTicks - 1 ? 'bash' : undefined;
    },
  },
  bash: {
    enter(e) {
      setAnim(e, 'bash');
      e.mem['bashCd'] = HAUGVORDR.bashEvery;
    },
    tick(e, c) {
      const d = DIR_VEC[e.facing];
      if (wallAhead(e, c, d, 14)) {
        still(e);
        c.emit({ t: 'shake', amount: 3 });
        c.emit({ t: 'sfx', id: 'sfx_stone' });
        return 'dazed';
      }
      e.vel = scale(d, HAUGVORDR.bashSpeed);
      return e.fsm.t >= HAUGVORDR.bashTicks - 1 ? 'recover' : undefined;
    },
  },
  dazed: {
    enter(e) {
      still(e);
      e.mem['open'] = 1;
      setAnim(e, 'dazed');
    },
    tick(e) {
      still(e);
      return e.fsm.t >= HAUGVORDR.dazedTicks - 1 ? 'advance' : undefined;
    },
  },
  recover: {
    enter(e) {
      still(e);
      e.mem['open'] = 1;
      setAnim(e, 'idle');
    },
    tick(e) {
      still(e);
      if (justHit(e) && e.fsm.t > HAUGVORDR.recoverTicks / 2) return 'advance';
      return e.fsm.t >= HAUGVORDR.recoverTicks - 1 ? 'advance' : undefined;
    },
  },
};
