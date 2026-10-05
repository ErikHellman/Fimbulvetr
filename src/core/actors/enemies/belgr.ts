import { mem, setAnim, type Entity } from '../entity';
import type { Machine } from '../fsm';
import { distToHero, faceHero, still, steerTo } from './common';
import type { ActorCtx } from './defs';

export type BelgrState = 'idle' | 'stalk' | 'swell' | 'breathe' | 'draw' | 'reel';

/** Belgr's numbers: px, px per tick and ticks. */
export const BELGR = {
  wake: 140,
  speed: 0.45,
  /** It breathes when Ask is this near, or after stalking this long. */
  near: 72,
  stalkTicks: 150,
  /** The bellows swell (the tell), then the fire cone. */
  swellTicks: 40,
  breatheTicks: 36,
  /** Drawing air after a breath: its intake gapes open, and a blast in it staggers the construct. */
  drawTicks: 110,
  /** Staggered: its plates hang loose and the blade bites. */
  reelTicks: 160,
} as const;

function guarded(e: Entity, exposed: boolean): void {
  e.mem['guard'] = 1;
  e.mem['exposed'] = exposed ? 1 : 0;
}

/**
 * Belgr, the bellows construct guarding the hammer (D6's mini-boss). Its iron turns every blow. It plods
 * after Ask; near enough, its bellows swell (the tell) and it breathes a cone of fire ahead, then stands
 * drawing air with its intake open. A heavy blow into the intake (a bomb's blast) staggers it, plates
 * hanging loose, and then the sword bites; otherwise it closes up and comes on again.
 */
export const BELGR_MACHINE: Machine<BelgrState, ActorCtx> = {
  idle: {
    tick(e, c) {
      guarded(e, false);
      still(e);
      setAnim(e, 'idle');
      return distToHero(e, c) < BELGR.wake ? 'stalk' : undefined;
    },
  },
  stalk: {
    enter(e) {
      setAnim(e, 'walk');
    },
    tick(e, c) {
      guarded(e, false);
      if (distToHero(e, c) < BELGR.near || e.fsm.t >= BELGR.stalkTicks) return 'swell';
      steerTo(e, c, c.hero, BELGR.speed);
      faceHero(e, c);
      return undefined;
    },
  },
  swell: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      setAnim(e, 'swell');
      c.emit({ t: 'sfx', id: 'sfx_bellows' });
    },
    tick(e) {
      guarded(e, false);
      still(e);
      return e.fsm.t >= BELGR.swellTicks - 1 ? 'breathe' : undefined;
    },
  },
  breathe: {
    enter(e, c) {
      setAnim(e, 'breathe');
      c.emit({ t: 'sfx', id: 'sfx_fire' });
    },
    tick(e) {
      guarded(e, false);
      still(e);
      return e.fsm.t >= BELGR.breatheTicks - 1 ? 'draw' : undefined;
    },
  },
  draw: {
    enter(e) {
      still(e);
      e.mem['struck'] = 0;
      guarded(e, true);
      setAnim(e, 'draw');
    },
    tick(e) {
      guarded(e, true);
      still(e);
      if (mem(e, 'struck') === 1) {
        e.mem['struck'] = 0;
        return 'reel';
      }
      return e.fsm.t >= BELGR.drawTicks - 1 ? 'stalk' : undefined;
    },
  },
  reel: {
    enter(e, c) {
      still(e);
      e.mem['guard'] = 0;
      e.mem['exposed'] = 0;
      e.iframes = 0;
      setAnim(e, 'reel');
      c.emit({ t: 'shake', amount: 4 });
    },
    tick(e) {
      still(e);
      e.mem['guard'] = 0;
      return e.fsm.t >= BELGR.reelTicks - 1 ? 'stalk' : undefined;
    },
  },
};
