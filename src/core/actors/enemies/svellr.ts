import { DIR_VEC, dirFromVec } from '../../math/dir';
import { sub } from '../../math/vec';
import { setAnim, type Entity } from '../entity';
import type { Machine } from '../fsm';
import { distToHero, still, wallAhead } from './common';
import type { ActorCtx } from './defs';

export type SvellrState = 'idle' | 'scrape' | 'charge' | 'stunned';

/** Svellr's numbers: px, px per tick and ticks. */
export const SVELLR = {
  wake: 200,
  /** It scrapes the floor (the tell), squared up on Ask along the nearer axis. */
  scrapeTicks: 50,
  /** Then charges straight that way until a wall stops it, or this long. */
  chargeSpeed: 3,
  chargeTicks: 150,
  /** Stunned against the wall: its ice is cracked open and the blade bites. */
  stunTicks: 150,
} as const;

function guarded(e: Entity, on: boolean): void {
  e.mem['guard'] = on ? 1 : 0;
}

/** Faces Ask along the dominant axis (a charge runs on rows and columns only). */
function squareUp(e: Entity, c: ActorCtx): void {
  e.facing = dirFromVec(sub(c.hero, e.pos), e.facing);
}

/**
 * Svellr, the glacier construct guarding the ice mirror (D7's mini-boss): a hulk of packed ice that turns
 * every blow. It scrapes the floor (the tell) squared up on Ask, then charges straight across the hall
 * until it hits a wall, and stands stunned, cracked open to the sword, before it scrapes again.
 */
export const SVELLR_MACHINE: Machine<SvellrState, ActorCtx> = {
  idle: {
    tick(e, c) {
      guarded(e, true);
      still(e);
      setAnim(e, 'idle');
      return distToHero(e, c) < SVELLR.wake ? 'scrape' : undefined;
    },
  },
  scrape: {
    enter(e, c) {
      still(e);
      squareUp(e, c);
      setAnim(e, 'scrape');
      c.emit({ t: 'sfx', id: 'sfx_slide' });
    },
    tick(e, c) {
      guarded(e, true);
      still(e);
      if (e.fsm.t < SVELLR.scrapeTicks / 2) squareUp(e, c);
      return e.fsm.t >= SVELLR.scrapeTicks - 1 ? 'charge' : undefined;
    },
  },
  charge: {
    enter(e, c) {
      setAnim(e, 'charge');
      c.emit({ t: 'sfx', id: 'sfx_charge' });
    },
    tick(e, c) {
      guarded(e, true);
      const d = DIR_VEC[e.facing];
      if (wallAhead(e, c, d, 14) || e.fsm.t >= SVELLR.chargeTicks) return 'stunned';
      e.vel = { x: d.x * SVELLR.chargeSpeed, y: d.y * SVELLR.chargeSpeed };
      return undefined;
    },
  },
  stunned: {
    enter(e, c) {
      still(e);
      guarded(e, false);
      e.iframes = 0;
      setAnim(e, 'stunned');
      c.emit({ t: 'shake', amount: 4 });
      c.emit({ t: 'sfx', id: 'sfx_glass' });
    },
    tick(e) {
      guarded(e, false);
      still(e);
      return e.fsm.t >= SVELLR.stunTicks - 1 ? 'scrape' : undefined;
    },
  },
};
