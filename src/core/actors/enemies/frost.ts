import { DIR_VEC } from '../../math/dir';
import { length, normalize, scale, sub } from '../../math/vec';
import { setAnim } from '../entity';
import type { Machine } from '../fsm';
import { distToHero, faceHero, justHit, still } from './common';
import type { ActorCtx } from './defs';

export type FrostvaettrState = 'hover' | 'glow' | 'loose' | 'rest' | 'hurt';

/** Frost wisp numbers: px, px per tick and ticks. */
export const FROSTVAETTR = {
  sight: 224,
  /** It keeps about this far from Ask, drifting to line up with Ask on a row or a column. */
  keep: 80,
  speed: 0.5,
  /** Lined up within this many px, it glows (the tell: 400 ms) and looses a rime bolt along the line. */
  line: 10,
  glowTicks: 24,
  looseTicks: 8,
  restTicks: 70,
  hurtTicks: 12,
} as const;

/**
 * The frost wisp (frostvættr), a rime spirit over Hrímfjöll's snow: it drifts to line up with Ask on a row
 * or column at a distance, glows (the tell) and looses a rime bolt straight along the line. The bolt flies
 * four ways only, so the ice mirror can send it straight back (M9b).
 */
export const FROSTVAETTR_MACHINE: Machine<FrostvaettrState, ActorCtx> = {
  hover: {
    enter(e) {
      setAnim(e, 'fly');
    },
    tick(e, c) {
      setAnim(e, 'fly');
      if (justHit(e)) return 'hurt';
      const d = distToHero(e, c);
      if (d > FROSTVAETTR.sight) {
        still(e);
        return undefined;
      }
      const off = sub(c.hero, e.pos);
      // Line up on whichever axis is nearer to lining up, at the keeping distance along the other.
      const onRow = Math.abs(off.y) <= Math.abs(off.x);
      const across = onRow ? off.y : off.x;
      const along = onRow ? off.x : off.y;
      if (Math.abs(across) <= FROSTVAETTR.line && e.fsm.t >= 20) {
        faceHero(e, c);
        return 'glow';
      }
      const want = onRow
        ? { x: Math.abs(along) < FROSTVAETTR.keep ? -Math.sign(along) : 0, y: Math.sign(across) }
        : { x: Math.sign(across), y: Math.abs(along) < FROSTVAETTR.keep ? -Math.sign(along) : 0 };
      e.vel = length(want) === 0 ? { x: 0, y: 0 } : scale(normalize(want), FROSTVAETTR.speed);
      return undefined;
    },
  },
  glow: {
    enter(e) {
      still(e);
      setAnim(e, 'tell');
    },
    tick(e) {
      still(e);
      if (justHit(e)) return 'hurt';
      return e.fsm.t >= FROSTVAETTR.glowTicks - 1 ? 'loose' : undefined;
    },
  },
  loose: {
    enter(e, c) {
      setAnim(e, 'loose');
      c.shoot('bolt', { x: e.pos.x, y: e.pos.y - 2 }, DIR_VEC[e.facing]);
    },
    tick(e) {
      still(e);
      return e.fsm.t >= FROSTVAETTR.looseTicks - 1 ? 'rest' : undefined;
    },
  },
  rest: {
    enter(e) {
      setAnim(e, 'fly');
    },
    tick(e) {
      still(e);
      if (justHit(e)) return 'hurt';
      return e.fsm.t >= FROSTVAETTR.restTicks - 1 ? 'hover' : undefined;
    },
  },
  hurt: {
    enter(e) {
      still(e);
      setAnim(e, 'hurt');
    },
    tick(e) {
      still(e);
      return e.fsm.t >= FROSTVAETTR.hurtTicks - 1 ? 'hover' : undefined;
    },
  },
};
