import { length, normalize, scale, sub } from '../../math/vec';
import { setAnim } from '../entity';
import type { Machine } from '../fsm';
import { distToHero, faceHero, justHit, still, toHero, wallAhead } from './common';
import type { ActorCtx } from './defs';

export type BogdraugrState = 'rise' | 'keep' | 'draw' | 'loose' | 'recover' | 'hurt';

/** Draugr archer numbers: px, px per tick and ticks. */
export const BOGDRAUGR = {
  riseTicks: 40,
  /** It keeps between these distances from Ask, and draws once inside the band. */
  near: 64,
  far: 112,
  sight: 180,
  speed: 0.5,
  /** The bow drawn: 400 ms. */
  drawTicks: 24,
  looseTicks: 8,
  recoverTicks: 60,
  hurtTicks: 14,
} as const;

/**
 * A draugr archer keeps its distance (backing off when Ask comes close), draws its bow (the telegraph)
 * and looses an arrow at Ask, which the shield stops. Then it rests a while and draws again.
 */
export const BOGDRAUGR_MACHINE: Machine<BogdraugrState, ActorCtx> = {
  rise: {
    tick(e) {
      setAnim(e, 'rise');
      e.iframes = Math.max(e.iframes, 2);
      return e.fsm.t >= BOGDRAUGR.riseTicks - 1 ? 'keep' : undefined;
    },
  },
  keep: {
    enter(e) {
      setAnim(e, 'walk');
    },
    tick(e, c) {
      if (justHit(e)) return 'hurt';
      const d = distToHero(e, c);
      faceHero(e, c);
      if (d > BOGDRAUGR.sight) {
        still(e);
        setAnim(e, 'idle');
        return undefined;
      }
      if (d >= BOGDRAUGR.near && d <= BOGDRAUGR.far && e.fsm.t >= 20) return 'draw';
      const away = d < BOGDRAUGR.near;
      const want = away ? normalize(sub(e.pos, c.hero)) : toHero(e, c);
      if (length(want) === 0 || wallAhead(e, c, want)) {
        still(e);
        // Backed against a wall: shoot anyway.
        return away && e.fsm.t >= 20 ? 'draw' : undefined;
      }
      e.vel = scale(want, BOGDRAUGR.speed);
      setAnim(e, 'walk');
      return undefined;
    },
  },
  draw: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      setAnim(e, 'tell');
    },
    tick(e, c) {
      still(e);
      if (justHit(e)) return 'hurt';
      faceHero(e, c);
      return e.fsm.t >= BOGDRAUGR.drawTicks - 1 ? 'loose' : undefined;
    },
  },
  loose: {
    enter(e, c) {
      setAnim(e, 'loose');
      c.shoot('arrow', { x: e.pos.x, y: e.pos.y - 4 }, toHero(e, c));
    },
    tick(e) {
      still(e);
      return e.fsm.t >= BOGDRAUGR.looseTicks - 1 ? 'recover' : undefined;
    },
  },
  recover: {
    enter(e) {
      setAnim(e, 'idle');
    },
    tick(e) {
      still(e);
      if (justHit(e)) return 'hurt';
      return e.fsm.t >= BOGDRAUGR.recoverTicks - 1 ? 'keep' : undefined;
    },
  },
  hurt: {
    enter(e) {
      still(e);
      setAnim(e, 'hurt');
    },
    tick(e) {
      still(e);
      return e.fsm.t >= BOGDRAUGR.hurtTicks - 1 ? 'keep' : undefined;
    },
  },
};
