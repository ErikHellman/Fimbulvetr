import { mem, setAnim } from '../entity';
import type { Machine } from '../fsm';
import { distToHero, faceHero, steerTo, still } from './common';
import type { ActorCtx } from './defs';

export type JotunvordrState = 'idle' | 'stalk' | 'raise' | 'stomp' | 'rest' | 'thawed';

/** Jötunvörðr's numbers: px, px per tick and ticks. */
export const JOTUNVORDR = {
  wake: 180,
  speed: 0.45,
  /** Within this, he raises a knee (the tell) to stomp. */
  reach: 52,
  raiseTicks: 30,
  /** The stomp: a ring of shock around him (his attack window, see content). */
  stompTicks: 16,
  restTicks: 50,
  /** Thawed by Eldr (his rime cracked, `mem.cracked`): open to the blade this long, then frozen hard again. */
  thawTicks: 180,
} as const;

const thawing = (e: Parameters<typeof mem>[0]): boolean => mem(e, 'cracked') === 1;

/**
 * Jötunvörðr, the frost-giant warden of Útgarðr's master key (D8's mini-boss). Frozen hard, every blow
 * turns off him (his `guard`, which Eldr's fire cracks). He lumbers after Ask, raises a knee (the tell) and
 * stomps a ring of shock around him. A bolt of Eldr thaws him: he staggers, open to the sword, until the
 * rime takes him again.
 */
export const JOTUNVORDR_MACHINE: Machine<JotunvordrState, ActorCtx> = {
  idle: {
    tick(e, c) {
      still(e);
      setAnim(e, 'idle');
      if (thawing(e)) return 'thawed';
      return distToHero(e, c) < JOTUNVORDR.wake ? 'stalk' : undefined;
    },
  },
  stalk: {
    enter(e) {
      setAnim(e, 'walk');
    },
    tick(e, c) {
      if (thawing(e)) return 'thawed';
      if (distToHero(e, c) < JOTUNVORDR.reach) return 'raise';
      steerTo(e, c, c.hero, JOTUNVORDR.speed);
      faceHero(e, c);
      return undefined;
    },
  },
  raise: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      setAnim(e, 'raise');
    },
    tick(e) {
      still(e);
      if (thawing(e)) return 'thawed';
      return e.fsm.t >= JOTUNVORDR.raiseTicks - 1 ? 'stomp' : undefined;
    },
  },
  stomp: {
    enter(e, c) {
      setAnim(e, 'stomp');
      c.emit({ t: 'shake', amount: 5 });
      c.emit({ t: 'sfx', id: 'sfx_quake' });
    },
    tick(e) {
      still(e);
      return e.fsm.t >= JOTUNVORDR.stompTicks - 1 ? 'rest' : undefined;
    },
  },
  rest: {
    enter(e) {
      setAnim(e, 'idle');
    },
    tick(e) {
      still(e);
      if (thawing(e)) return 'thawed';
      return e.fsm.t >= JOTUNVORDR.restTicks - 1 ? 'stalk' : undefined;
    },
  },
  thawed: {
    enter(e, c) {
      still(e);
      e.iframes = 0;
      setAnim(e, 'thawed');
      c.emit({ t: 'sfx', id: 'sfx_sizzle' });
    },
    tick(e) {
      still(e);
      if (e.fsm.t < JOTUNVORDR.thawTicks - 1) return undefined;
      // The rime takes him again.
      e.mem['cracked'] = 0;
      return 'stalk';
    },
  },
};
