import { DIR_VEC, dirFromVec } from '../../math/dir';
import { sub } from '../../math/vec';
import { mem, setAnim, type Entity } from '../entity';
import type { Machine } from '../fsm';
import { distToHero, faceHero, steerTo, still } from './common';
import type { ActorCtx } from './defs';

export type KolbeinnState = 'stand' | 'stalk' | 'draw' | 'strike' | 'recover' | 'cast' | 'loose' | 'reel';

/** Kolbeinn's numbers in his hall: px, px per tick and ticks. */
export const KOLBEINN = {
  standTicks: 60,
  speed: 0.8,
  reach: 28,
  /** The staff drawn back (the tell) before the first blow of a chain, and before each later one. */
  drawTicks: 26,
  chainDraw: 14,
  strikeTicks: 10,
  /** Blows in a chain. */
  chain: 3,
  recoverTicks: 30,
  /** From half his health: a rime bolt between chains (its tell: the staff raised, glowing). */
  castTicks: 40,
  looseTicks: 14,
  /** His own bolt sent back off the mirror: he reels, open to the sword. */
  reelTicks: 90,
} as const;

/** Every blow on his staff from the front turns (his `shield`), except while a blow of his falls or he reels. */
function guard(e: Entity, open: boolean): void {
  e.mem['open'] = open ? 1 : 0;
  // A reflected rime bolt always reaches him (`EnemyDef.struckBy`).
  e.mem['exposed'] = 1;
}

function struck(e: Entity): boolean {
  if (mem(e, 'struck') !== 1) return false;
  e.mem['struck'] = 0;
  return true;
}

const half = (e: Entity): boolean => e.hp <= Math.floor(e.maxHp / 2);
const quarter = (e: Entity): boolean => e.hp <= Math.floor(e.maxHp / 4);

/** At a quarter of his health, once: two draugr rise at his sides. */
function call(e: Entity, c: ActorCtx): void {
  if (!quarter(e) || mem(e, 'called') === 1) return;
  e.mem['called'] = 1;
  c.spawn('draugr', { x: e.pos.x - 48, y: e.pos.y + 8 }, 's');
  c.spawn('draugr', { x: e.pos.x + 48, y: e.pos.y + 8 }, 's');
  c.emit({ t: 'sfx', id: 'sfx_boss_roar' });
}

/**
 * Kolbeinn the seiðmaðr, in his hall in Útgarðr's keep (D8): a duel won by the parry, as Styrr taught.
 *
 * 1. He keeps his seiðr-staff across him, and every blow from the front turns. Close in, he draws it back
 *    (the tell) and strikes three times; a parry as a blow falls leaves him staggered and open.
 * 2. At half his health he steps off between chains and looses a rime bolt; the ice mirror sends it back,
 *    and he reels, open.
 * 3. At a quarter, once, he calls two draugr up out of the floor.
 */
export const KOLBEINN_MACHINE: Machine<KolbeinnState, ActorCtx> = {
  stand: {
    tick(e, c) {
      guard(e, false);
      still(e);
      faceHero(e, c);
      setAnim(e, 'idle');
      return e.fsm.t >= KOLBEINN.standTicks - 1 ? 'stalk' : undefined;
    },
  },
  stalk: {
    enter(e) {
      setAnim(e, 'walk');
    },
    tick(e, c) {
      guard(e, false);
      if (struck(e)) return 'reel';
      call(e, c);
      if (distToHero(e, c) < KOLBEINN.reach) {
        e.mem['chain'] = 0;
        return 'draw';
      }
      steerTo(e, c, c.hero, KOLBEINN.speed);
      faceHero(e, c);
      return undefined;
    },
  },
  draw: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      setAnim(e, 'draw');
    },
    tick(e) {
      guard(e, false);
      still(e);
      if (struck(e)) return 'reel';
      const tell = mem(e, 'chain') === 0 ? KOLBEINN.drawTicks : KOLBEINN.chainDraw;
      return e.fsm.t >= tell - 1 ? 'strike' : undefined;
    },
  },
  strike: {
    enter(e, c) {
      // Open as the blow falls: a parry now leaves him staggered with his guard down.
      guard(e, true);
      setAnim(e, 'strike');
      c.emit({ t: 'sfx', id: 'sfx_swing' });
    },
    tick(e) {
      guard(e, true);
      still(e);
      if (e.fsm.t < KOLBEINN.strikeTicks - 1) return undefined;
      e.mem['chain'] = mem(e, 'chain') + 1;
      return mem(e, 'chain') < KOLBEINN.chain ? 'draw' : 'recover';
    },
  },
  recover: {
    enter(e) {
      setAnim(e, 'idle');
    },
    tick(e, c) {
      guard(e, false);
      still(e);
      if (struck(e)) return 'reel';
      call(e, c);
      if (e.fsm.t < KOLBEINN.recoverTicks - 1) return undefined;
      return half(e) ? 'cast' : 'stalk';
    },
  },
  cast: {
    enter(e, c) {
      still(e);
      e.facing = dirFromVec(sub(c.hero, e.pos), e.facing);
      setAnim(e, 'cast');
    },
    tick(e, c) {
      guard(e, false);
      still(e);
      if (struck(e)) return 'reel';
      // Squared up on Ask along a row or a column, so the mirror can send the bolt straight back.
      if (e.fsm.t < KOLBEINN.castTicks / 2) e.facing = dirFromVec(sub(c.hero, e.pos), e.facing);
      return e.fsm.t >= KOLBEINN.castTicks - 1 ? 'loose' : undefined;
    },
  },
  loose: {
    enter(e, c) {
      setAnim(e, 'strike');
      c.shoot('bolt', { x: e.pos.x, y: e.pos.y - 6 }, DIR_VEC[e.facing]);
    },
    tick(e) {
      guard(e, false);
      still(e);
      if (struck(e)) return 'reel';
      return e.fsm.t >= KOLBEINN.looseTicks - 1 ? 'stalk' : undefined;
    },
  },
  reel: {
    enter(e, c) {
      guard(e, true);
      still(e);
      e.iframes = 0;
      setAnim(e, 'reel');
      c.emit({ t: 'sfx', id: 'sfx_glass' });
    },
    tick(e) {
      guard(e, true);
      still(e);
      return e.fsm.t >= KOLBEINN.reelTicks - 1 ? 'stalk' : undefined;
    },
  },
};
