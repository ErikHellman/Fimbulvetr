import { setAnim, type Entity } from '../entity';
import type { Machine } from '../fsm';
import { distToHero, faceHero, justHit, steerTo, still } from './common';
import type { ActorCtx } from './defs';

export type HuscarlState = 'stand' | 'stalk' | 'tell' | 'cut' | 'wind' | 'heavy' | 'recover' | 'hurt';

/** Styrr in the duel: px, px per tick, ticks and health. */
export const HUSCARL = {
  /** He salutes before the first step. */
  standTicks: 40,
  reach: 26,
  speed: 0.7,
  /** The cut's tell: the blade drawn back over the shield (400 ms). */
  tellTicks: 24,
  cutTicks: 10,
  /** The heavy overhead's wind-up (500 ms). */
  windTicks: 30,
  heavyTicks: 14,
  recoverTicks: 24,
  hurtTicks: 14,
  /** At this health or less, every other attack is the heavy overhead. */
  heavyAt: 6,
} as const;

/**
 * Styrr, duelling in his yard: he keeps his shield up and cuts (the dash thrust gets through), and once
 * worn down, every other attack is a heavy overhead that staggers through the shield. His guard is down
 * (`mem.open`) only while that blow falls; a parry leaves him stunned with it down.
 */
export const HUSCARL_MACHINE: Machine<HuscarlState, ActorCtx> = {
  stand: {
    tick(e, c) {
      setAnim(e, 'idle');
      still(e);
      faceHero(e, c);
      return e.fsm.t >= HUSCARL.standTicks - 1 ? 'stalk' : undefined;
    },
  },
  stalk: {
    enter(e) {
      e.mem['open'] = 0;
      setAnim(e, 'walk');
    },
    tick(e, c) {
      if (justHit(e)) return 'hurt';
      if (distToHero(e, c) < HUSCARL.reach) {
        if (e.hp > HUSCARL.heavyAt) return 'tell';
        // Worn down, he alternates: a cut, then the heavy overhead.
        e.mem['alt'] = e.mem['alt'] === 1 ? 0 : 1;
        return e.mem['alt'] === 1 ? 'wind' : 'tell';
      }
      steerTo(e, c, c.hero, HUSCARL.speed);
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
      return e.fsm.t >= HUSCARL.tellTicks - 1 ? 'cut' : undefined;
    },
  },
  cut: {
    enter(e, c) {
      setAnim(e, 'cut');
      c.emit({ t: 'sfx', id: 'sfx_swing' });
    },
    tick(e) {
      still(e);
      return e.fsm.t >= HUSCARL.cutTicks - 1 ? 'recover' : undefined;
    },
  },
  wind: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      setAnim(e, 'wind');
    },
    tick(e) {
      still(e);
      return e.fsm.t >= HUSCARL.windTicks - 1 ? 'heavy' : undefined;
    },
  },
  heavy: {
    enter(e, c) {
      e.mem['open'] = 1;
      setAnim(e, 'heavy');
      c.emit({ t: 'sfx', id: 'sfx_swing' });
    },
    tick(e) {
      still(e);
      return e.fsm.t >= HUSCARL.heavyTicks - 1 ? 'recover' : undefined;
    },
  },
  recover: {
    enter(e) {
      e.mem['open'] = 0;
      setAnim(e, 'idle');
    },
    tick(e: Entity) {
      still(e);
      if (justHit(e)) return 'hurt';
      return e.fsm.t >= HUSCARL.recoverTicks - 1 ? 'stalk' : undefined;
    },
  },
  hurt: {
    enter(e) {
      e.mem['open'] = 0;
      still(e);
      setAnim(e, 'hurt');
    },
    tick(e) {
      still(e);
      return e.fsm.t >= HUSCARL.hurtTicks - 1 ? 'stalk' : undefined;
    },
  },
};
