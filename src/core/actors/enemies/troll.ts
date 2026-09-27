import { nextInt } from '../../math/rng';
import { DIR_VEC, DIRS } from '../../math/dir';
import { mem, setAnim, type Entity } from '../entity';
import type { Machine } from '../fsm';
import { distToHero, faceHero, still, wallAhead } from './common';
import type { ActorCtx } from './defs';

export type TrollState = 'stomp' | 'tell' | 'smash' | 'recover';

export const TROLL = {
  speed: 0.45,
  legTicks: 90,
  reach: 44,
  /** The club goes up (with the smash's own wind-up, 500 ms). */
  tellTicks: 26,
  smashTicks: 14,
  recoverTicks: 50,
} as const;

/** Sets off in a random direction (or stands a moment, when the roll says so). */
function newLeg(e: Entity, c: ActorCtx): void {
  const dir = DIRS[nextInt(c.rng, 0, DIRS.length)] ?? 's';
  const d = DIR_VEC[dir];
  e.vel = { x: d.x * TROLL.speed, y: d.y * TROLL.speed };
  e.facing = dir;
  e.mem['leg'] = 0;
}

/**
 * A raid troll: far too strong to fight. It stomps about the burning yard in straight legs, and when the
 * hero comes close it raises its club (the telegraph) and brings it down. Every blow clinks off its hide.
 */
export const TROLL_MACHINE: Machine<TrollState, ActorCtx> = {
  stomp: {
    enter(e, c) {
      newLeg(e, c);
      setAnim(e, 'walk');
    },
    tick(e, c) {
      if (distToHero(e, c) < TROLL.reach) return 'tell';
      const leg = mem(e, 'leg') + 1;
      e.mem['leg'] = leg;
      const moving = e.vel.x !== 0 || e.vel.y !== 0;
      if (!moving || leg >= TROLL.legTicks || wallAhead(e, c, DIR_VEC[e.facing], 18)) newLeg(e, c);
      return undefined;
    },
  },
  tell: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      setAnim(e, 'tell');
      c.emit({ t: 'sfx', id: 'sfx_growl' });
    },
    tick(e) {
      still(e);
      return e.fsm.t >= TROLL.tellTicks - 1 ? 'smash' : undefined;
    },
  },
  smash: {
    enter(e, c) {
      setAnim(e, 'smash');
      c.emit({ t: 'sfx', id: 'sfx_hit' });
    },
    tick(e) {
      still(e);
      return e.fsm.t >= TROLL.smashTicks - 1 ? 'recover' : undefined;
    },
  },
  recover: {
    enter(e) {
      setAnim(e, 'idle');
    },
    tick(e) {
      still(e);
      return e.fsm.t >= TROLL.recoverTicks - 1 ? 'stomp' : undefined;
    },
  },
};
