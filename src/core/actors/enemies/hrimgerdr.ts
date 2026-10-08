import { DIR_VEC, dirFromVec } from '../../math/dir';
import { sub } from '../../math/vec';
import { mem, setAnim, type Entity } from '../entity';
import type { Machine } from '../fsm';
import { distToHero, still } from './common';
import type { ActorCtx } from './defs';

export type HrimgerdrState = 'idle' | 'rise' | 'cast' | 'loose' | 'rest' | 'kneel' | 'rage';
export type IcicleState = 'shadow' | 'fall' | 'shatter';

/** Hrímgerðr's numbers: px, rows and ticks. */
export const HRIMGERDR = {
  /** Health at or below which each later phase begins (18 → two bolts and the glazed floor at 12, icicles at 6). */
  phaseAt: [12, 6],
  wake: 200,
  riseTicks: 60,
  /** Her hand glows (the tell), then the rime bolt; in the last phase the tell is short. */
  castTicks: 50,
  castFast: 30,
  /** In the later phases a second bolt follows the first this long after, re-aimed. */
  secondAfter: 22,
  looseTicks: 10,
  restTicks: 70,
  restFast: 50,
  /** Struck by her own bolt off the mirror: she kneels, open to the blade and arrows. */
  kneelTicks: 150,
  rageTicks: 50,
  /** From the second phase every floor tile from this row down is glaze. */
  rimeRow: 8,
  /** An icicle's shadow (the tell), then the fall. */
  shadowTicks: 50,
  fallTicks: 10,
  shatterTicks: 16,
} as const;

const phaseOf = (hp: number): number => HRIMGERDR.phaseAt.filter((at) => hp <= at).length;

/** Every blow clinks off her rime, but her own bolt sent back breaks through (`EnemyDef.struckBy`). */
function warded(e: Entity): void {
  e.mem['guard'] = 1;
  e.mem['exposed'] = 1;
}

function struck(e: Entity): boolean {
  if (mem(e, 'struck') !== 1) return false;
  e.mem['struck'] = 0;
  return true;
}

/** Faces Ask along the dominant axis: her bolts fly on rows and columns only, so the mirror can return them. */
function aim(e: Entity, c: ActorCtx): void {
  e.facing = dirFromVec(sub(c.hero, e.pos), e.facing);
}

function loose(e: Entity, c: ActorCtx): void {
  c.shoot('bolt', { x: e.pos.x, y: e.pos.y - 4 }, DIR_VEC[e.facing]);
}

/**
 * Thane Hrímgerðr, the Glass: a giantess of rime who stands at the far end of her hall and never walks.
 *
 * 1. Her hand glows (the tell) and she casts a rime bolt along a row or a column at Ask. Every blow turns
 *    off her, but her own bolt sent back by the ice mirror breaks her ward: she kneels, open to the sword.
 * 2. At two thirds of her health two bolts follow each other, and the floor below her (`mem.rimeFloor`)
 *    turns to glaze, so Ask slides between them.
 * 3. At the last third icicles fall where Ask stands (tell: their shadows), and her bolts come faster.
 */
export const HRIMGERDR_MACHINE: Machine<HrimgerdrState, ActorCtx> = {
  idle: {
    tick(e, c) {
      warded(e);
      still(e);
      setAnim(e, 'idle');
      return distToHero(e, c) < HRIMGERDR.wake ? 'rise' : undefined;
    },
  },
  rise: {
    enter(e, c) {
      still(e);
      setAnim(e, 'roar');
      c.emit({ t: 'sfx', id: 'sfx_boss_roar' });
      c.emit({ t: 'shake', amount: 4 });
    },
    tick(e) {
      warded(e);
      still(e);
      return e.fsm.t >= HRIMGERDR.riseTicks - 1 ? 'cast' : undefined;
    },
  },
  cast: {
    enter(e, c) {
      still(e);
      aim(e, c);
      setAnim(e, 'cast');
    },
    tick(e, c) {
      warded(e);
      still(e);
      if (struck(e)) return 'kneel';
      const tell = mem(e, 'phase') >= 2 ? HRIMGERDR.castFast : HRIMGERDR.castTicks;
      if (e.fsm.t < tell / 2) aim(e, c);
      return e.fsm.t >= tell - 1 ? 'loose' : undefined;
    },
  },
  loose: {
    enter(e, c) {
      setAnim(e, 'loose');
      loose(e, c);
    },
    tick(e, c) {
      warded(e);
      still(e);
      if (struck(e)) return 'kneel';
      const twice = mem(e, 'phase') >= 1;
      if (twice && e.fsm.t === HRIMGERDR.secondAfter) {
        aim(e, c);
        loose(e, c);
      }
      const end = twice ? HRIMGERDR.secondAfter + HRIMGERDR.looseTicks : HRIMGERDR.looseTicks;
      return e.fsm.t >= end - 1 ? 'rest' : undefined;
    },
  },
  rest: {
    enter(e, c) {
      setAnim(e, 'idle');
      if (mem(e, 'phase') >= 2) c.spawn('icicle', { ...c.hero }, 's');
    },
    tick(e) {
      warded(e);
      still(e);
      if (struck(e)) return 'kneel';
      const rest = mem(e, 'phase') >= 2 ? HRIMGERDR.restFast : HRIMGERDR.restTicks;
      return e.fsm.t >= rest - 1 ? 'cast' : undefined;
    },
  },
  kneel: {
    enter(e, c) {
      still(e);
      e.mem['guard'] = 0;
      e.mem['exposed'] = 0;
      e.iframes = 0;
      setAnim(e, 'kneel');
      c.emit({ t: 'sfx', id: 'sfx_glass' });
      c.emit({ t: 'shake', amount: 3 });
    },
    tick(e) {
      e.mem['guard'] = 0;
      e.mem['exposed'] = 0;
      still(e);
      if (e.fsm.t < HRIMGERDR.kneelTicks - 1) return undefined;
      return phaseOf(e.hp) > mem(e, 'phase') ? 'rage' : 'cast';
    },
  },
  rage: {
    enter(e, c) {
      still(e);
      e.mem['phase'] = phaseOf(e.hp);
      e.mem['rimeFloor'] = HRIMGERDR.rimeRow;
      setAnim(e, 'roar');
      c.emit({ t: 'sfx', id: 'sfx_boss_roar' });
      c.emit({ t: 'sfx', id: 'sfx_frost' });
      c.emit({ t: 'shake', amount: 5 });
    },
    tick(e) {
      warded(e);
      still(e);
      return e.fsm.t >= HRIMGERDR.rageTicks - 1 ? 'cast' : undefined;
    },
  },
};

/** An icicle from Hrímgerðr's roof: its shadow grows where Ask stood (the tell), then it falls and shatters. */
export const ICICLE_MACHINE: Machine<IcicleState, ActorCtx> = {
  shadow: {
    tick(e) {
      setAnim(e, 'shadow');
      still(e);
      e.iframes = Math.max(e.iframes, 2);
      return e.fsm.t >= HRIMGERDR.shadowTicks - 1 ? 'fall' : undefined;
    },
  },
  fall: {
    enter(e, c) {
      setAnim(e, 'fall');
      c.emit({ t: 'sfx', id: 'sfx_glass' });
    },
    tick(e) {
      still(e);
      e.iframes = Math.max(e.iframes, 2);
      return e.fsm.t >= HRIMGERDR.fallTicks - 1 ? 'shatter' : undefined;
    },
  },
  shatter: {
    enter(e) {
      setAnim(e, 'shatter');
    },
    tick(e) {
      still(e);
      e.iframes = Math.max(e.iframes, 2);
      if (e.fsm.t >= HRIMGERDR.shatterTicks - 1) e.mem['gone'] = 1;
      return undefined;
    },
  },
};
