import { dirFromVec } from '../../math/dir';
import { scale } from '../../math/vec';
import { mem, setAnim, type Entity } from '../entity';
import type { Machine } from '../fsm';
import { distToHero, faceHero, still, steerTo, toHero, wallAhead } from './common';
import type { ActorCtx } from './defs';

export type GarmrState =
  'sleep' | 'roar' | 'stalk' | 'tell' | 'breath' | 'crouch' | 'lunge' | 'recover' | 'reel' | 'rise';

/** Garmr's numbers: px, px per tick and ticks. */
export const GARMR = {
  /** Health at or below which it breathes and lunges faster (24 → 12). */
  phaseAt: 12,
  wake: 144,
  speed: 0.7,
  /** Closer than this it breathes; further off, once its lunge is ready, it lunges. */
  reach: 44,
  /** Three heads drawing breath (500 ms), then the sweep of frost-breath. */
  breathTell: 30,
  breathTellLast: 20,
  breathTicks: 30,
  lungeEvery: 120,
  /** The first lunge comes soon after it wakes. */
  lungeFirst: 30,
  crouchTicks: 24,
  lungeSpeed: 3.2,
  lungeTicks: 20,
  recoverTicks: 48,
  /** Hooked by the collar ring: dragged off its feet, open to the blade (2.5 s). */
  reelTicks: 150,
  riseTicks: 40,
  roarTicks: 50,
} as const;

/** Every blow clinks off its hide, except while it reels. A hook during a lunge slips. */
function guarded(e: Entity): void {
  e.mem['guard'] = 1;
}

/** The grapple caught its collar ring (`mem.hooked`): it is pulled off balance. */
function hooked(e: Entity): boolean {
  if (mem(e, 'hooked') !== 1) return false;
  e.mem['hooked'] = 0;
  return true;
}

/**
 * Garmr, the hound at Hel's gate: three heads, an iron collar with a ring, a hide no blade bites. It sleeps
 * until Ask comes near, roars, and stalks: close in, its heads draw breath (the tell) and sweep a gust of
 * grave-frost before it; further off, every two seconds, it crouches and lunges in a locked line. The
 * grapple chain hooked in its collar ring drags it off its feet, open to the blade until it rises. At half
 * health it draws breath faster. A mini-boss: the grapple chest lies at its feet.
 */
export const GARMR_MACHINE: Machine<GarmrState, ActorCtx> = {
  sleep: {
    tick(e, c) {
      guarded(e);
      still(e);
      setAnim(e, 'sleep');
      e.mem['hooked'] = 0;
      return distToHero(e, c) < GARMR.wake ? 'roar' : undefined;
    },
  },
  roar: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      setAnim(e, 'roar');
      c.emit({ t: 'sfx', id: 'sfx_boss_roar' });
      c.emit({ t: 'shake', amount: 4 });
    },
    tick(e) {
      guarded(e);
      still(e);
      if (e.fsm.t < GARMR.roarTicks - 1) return undefined;
      e.mem['lungeCd'] = GARMR.lungeFirst;
      return 'stalk';
    },
  },
  stalk: {
    enter(e) {
      setAnim(e, 'walk');
    },
    tick(e, c) {
      guarded(e);
      if (hooked(e)) return 'reel';
      e.mem['lungeCd'] = Math.max(0, mem(e, 'lungeCd') - 1);
      const d = distToHero(e, c);
      if (d < GARMR.reach) return 'tell';
      if (mem(e, 'lungeCd') === 0) return 'crouch';
      steerTo(e, c, c.hero, GARMR.speed);
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
      guarded(e);
      still(e);
      if (hooked(e)) return 'reel';
      const tell = e.hp <= GARMR.phaseAt ? GARMR.breathTellLast : GARMR.breathTell;
      return e.fsm.t >= tell - 1 ? 'breath' : undefined;
    },
  },
  breath: {
    enter(e, c) {
      setAnim(e, 'breath');
      c.emit({ t: 'sfx', id: 'sfx_breath' });
    },
    tick(e) {
      guarded(e);
      still(e);
      if (hooked(e)) return 'reel';
      return e.fsm.t >= GARMR.breathTicks - 1 ? 'recover' : undefined;
    },
  },
  crouch: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      const d = toHero(e, c);
      e.mem['ldx'] = d.x;
      e.mem['ldy'] = d.y;
      setAnim(e, 'tell');
      c.emit({ t: 'sfx', id: 'sfx_growl' });
    },
    tick(e) {
      guarded(e);
      still(e);
      if (hooked(e)) return 'reel';
      return e.fsm.t >= GARMR.crouchTicks - 1 ? 'lunge' : undefined;
    },
  },
  lunge: {
    enter(e) {
      setAnim(e, 'lunge');
    },
    tick(e, c) {
      guarded(e);
      // A hook thrown at a lunging hound slips off its collar.
      e.mem['hooked'] = 0;
      const d = { x: mem(e, 'ldx'), y: mem(e, 'ldy') };
      e.facing = dirFromVec(d, e.facing);
      if (wallAhead(e, c, d, 16) || e.fsm.t >= GARMR.lungeTicks - 1) {
        still(e);
        if (e.fsm.t < GARMR.lungeTicks - 1) c.emit({ t: 'shake', amount: 3 });
        return 'recover';
      }
      e.vel = scale(d, GARMR.lungeSpeed);
      return undefined;
    },
  },
  recover: {
    enter(e) {
      still(e);
      setAnim(e, 'idle');
    },
    tick(e) {
      guarded(e);
      still(e);
      if (hooked(e)) return 'reel';
      if (e.fsm.t < GARMR.recoverTicks - 1) return undefined;
      e.mem['lungeCd'] = GARMR.lungeEvery;
      return 'stalk';
    },
  },
  reel: {
    enter(e, c) {
      still(e);
      e.mem['guard'] = 0;
      e.iframes = 0;
      setAnim(e, 'reel');
      c.emit({ t: 'shake', amount: 5 });
      c.emit({ t: 'sfx', id: 'sfx_stun' });
    },
    tick(e) {
      still(e);
      e.mem['guard'] = 0;
      e.mem['hooked'] = 0;
      return e.fsm.t >= GARMR.reelTicks - 1 ? 'rise' : undefined;
    },
  },
  rise: {
    enter(e, c) {
      still(e);
      setAnim(e, 'roar');
      c.emit({ t: 'sfx', id: 'sfx_boss_roar' });
    },
    tick(e) {
      guarded(e);
      still(e);
      e.mem['hooked'] = 0;
      if (e.fsm.t < GARMR.riseTicks - 1) return undefined;
      e.mem['lungeCd'] = GARMR.lungeEvery;
      return 'stalk';
    },
  },
};
