import type { Vec } from '../../math/vec';
import { mem, setAnim, type Entity } from '../entity';
import type { Machine } from '../fsm';
import { aim, distToHero, faceHero, justHit, lockAim, roam, steerTo, still, wallAhead } from './common';
import type { ActorCtx } from './defs';

export type AlphaState = 'prowl' | 'stalk' | 'howl' | 'tell' | 'lunge' | 'recover' | 'hurt';

/** Pack-leader numbers: px, px per tick and ticks. */
export const ALPHA = {
  sight: 128,
  lose: 200,
  reach: 48,
  prowlSpeed: 0.45,
  stalkSpeed: 0.85,
  /** Head thrown back before the pack answers: 400 ms. */
  howlTicks: 24,
  /** Ticks of stalking between howls. */
  howlEvery: 300,
  /** Its own vargr alive at once. */
  packMax: 2,
  tellTicks: 24,
  lungeSpeed: 3.6,
  lungeTicks: 16,
  recoverTicks: 30,
  hurtTicks: 12,
} as const;

/** Where called vargr come from: beside and behind the leader, the first free spots. */
const CALL_SPOTS: readonly Vec[] = [
  { x: -28, y: 0 },
  { x: 28, y: 0 },
  { x: 0, y: -28 },
  { x: -24, y: -24 },
  { x: 24, y: -24 },
  { x: 0, y: 28 },
];

/** Live foes this enemy called (vargr carry their caller's id in `mem.caller`). */
export function calledBy(e: Entity, c: ActorCtx): number {
  return c.others.filter((a) => a.kind === 'enemy' && a.hp > 0 && mem(a, 'caller') === e.id).length;
}

/** Calls up to `n` vargr at free spots around `e`. */
export function callVargr(e: Entity, c: ActorCtx, n: number): void {
  let left = n;
  for (const spot of CALL_SPOTS) {
    if (left <= 0) return;
    const at = { x: e.pos.x + spot.x, y: e.pos.y + spot.y };
    if (c.solidAt(Math.floor(at.x / 16), Math.floor((at.y - 1) / 16))) continue;
    const v = c.spawn('vargr', at, e.facing);
    v.mem['caller'] = e.id;
    left--;
  }
}

/**
 * The pack leader stalks like any vargr, but on first sight — and every few seconds while its pack is
 * short — it stops and howls (the tell), and vargr come until two of its own are alive. A blow during
 * the howl cuts it off. Its lunge is heavier and staggers through a shield.
 */
export const ALPHA_MACHINE: Machine<AlphaState, ActorCtx> = {
  prowl: {
    enter(e) {
      setAnim(e, 'walk');
    },
    tick(e, c) {
      if (justHit(e)) return 'hurt';
      if (distToHero(e, c) < ALPHA.sight) {
        // First sight: howl at once.
        e.mem['howlT'] = ALPHA.howlEvery;
        return 'stalk';
      }
      roam(e, c, ALPHA.prowlSpeed, 48);
      setAnim(e, e.vel.x !== 0 || e.vel.y !== 0 ? 'walk' : 'idle');
      return undefined;
    },
  },
  stalk: {
    enter(e) {
      setAnim(e, 'walk');
    },
    tick(e, c) {
      if (justHit(e)) return 'hurt';
      const d = distToHero(e, c);
      if (d > ALPHA.lose) return 'prowl';
      const t = mem(e, 'howlT') + 1;
      e.mem['howlT'] = t;
      if (t >= ALPHA.howlEvery && calledBy(e, c) < ALPHA.packMax) return 'howl';
      if (d < ALPHA.reach) return 'tell';
      steerTo(e, c, c.hero, ALPHA.stalkSpeed);
      return undefined;
    },
  },
  howl: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      setAnim(e, 'howl');
      e.mem['howlT'] = 0;
      c.emit({ t: 'sfx', id: 'sfx_howl' });
    },
    tick(e, c) {
      still(e);
      if (justHit(e)) return 'hurt';
      if (e.fsm.t < ALPHA.howlTicks - 1) return undefined;
      callVargr(e, c, ALPHA.packMax - calledBy(e, c));
      return 'stalk';
    },
  },
  tell: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      setAnim(e, 'tell');
      c.emit({ t: 'sfx', id: 'sfx_growl' });
    },
    tick(e, c) {
      still(e);
      if (justHit(e)) return 'hurt';
      if (e.fsm.t < ALPHA.tellTicks - 1) {
        faceHero(e, c);
        return undefined;
      }
      lockAim(e, c);
      return 'lunge';
    },
  },
  lunge: {
    enter(e) {
      setAnim(e, 'lunge');
    },
    tick(e, c) {
      const d = aim(e);
      if (wallAhead(e, c, d) || e.fsm.t >= ALPHA.lungeTicks - 1) {
        still(e);
        return 'recover';
      }
      e.vel = { x: d.x * ALPHA.lungeSpeed, y: d.y * ALPHA.lungeSpeed };
      return undefined;
    },
  },
  recover: {
    enter(e) {
      still(e);
      setAnim(e, 'idle');
    },
    tick(e) {
      if (justHit(e)) return 'hurt';
      return e.fsm.t >= ALPHA.recoverTicks - 1 ? 'stalk' : undefined;
    },
  },
  hurt: {
    enter(e) {
      still(e);
      setAnim(e, 'hurt');
    },
    tick(e) {
      still(e);
      return e.fsm.t >= ALPHA.hurtTicks - 1 ? 'stalk' : undefined;
    },
  },
};
