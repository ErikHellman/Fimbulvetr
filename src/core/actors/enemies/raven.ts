import { length, normalize, scale, sub, type Vec } from '../../math/vec';
import { mem, setAnim, type Entity } from '../entity';
import type { Machine } from '../fsm';
import { calledBy, callVargr } from './alpha';
import { aim, distToHero, faceHero, justHit, lockAim, still } from './common';
import type { ActorCtx } from './defs';

export type RavenState = 'circle' | 'shriek' | 'dive' | 'climb' | 'hurt';

/** Rime-raven numbers: px, px per tick and ticks. */
export const RIME_RAVEN = {
  sight: 96,
  radius: 40,
  circleSpeed: 1.1,
  /** The shriek before the dive: 400 ms. */
  shriekTicks: 24,
  diveSpeed: 3.5,
  diveTicks: 26,
  climbSpeed: 0.7,
  climbTicks: 90,
  /** Ticks back on the wing before it may spot Ask again. */
  restTicks: 120,
  hurtTicks: 10,
} as const;

const D = 0.7071067811865476;
/** The ring it flies, as eight points around its home (no trigonometry in core). */
const RING: readonly Vec[] = [
  { x: 1, y: 0 },
  { x: D, y: D },
  { x: 0, y: 1 },
  { x: -D, y: D },
  { x: -1, y: 0 },
  { x: -D, y: -D },
  { x: 0, y: -1 },
  { x: D, y: -D },
];

function home(e: Entity): Vec {
  if (e.mem['homeX'] === undefined) {
    e.mem['homeX'] = e.pos.x;
    e.mem['homeY'] = e.pos.y;
  }
  return { x: mem(e, 'homeX'), y: mem(e, 'homeY') };
}

/** Flies straight at `to` (the raven is over the walls); true once there. */
function flyTo(e: Entity, to: Vec, speed: number): boolean {
  const d = sub(to, e.pos);
  const left = length(d);
  if (left <= speed) {
    e.vel = d;
    return true;
  }
  e.vel = scale(normalize(d), speed);
  if (Math.abs(d.x) > 0.5) e.facing = d.x < 0 ? 'w' : 'e';
  return false;
}

/**
 * The Rime King's raven circles high over the night wood, out of any blade's reach. When it spots Ask it
 * hangs in the air and shrieks (the tell) — a vargr answers if none it called still lives — then it dives
 * along a locked line and climbs back slowly: the time to strike it.
 */
export const RIME_RAVEN_MACHINE: Machine<RavenState, ActorCtx> = {
  circle: {
    enter(e) {
      setAnim(e, 'fly');
    },
    tick(e, c) {
      // The start state: `enter` does not run at spawn, so the pose is set here.
      setAnim(e, 'fly');
      e.iframes = Math.max(e.iframes, 2);
      const h = home(e);
      const rest = mem(e, 'rest');
      if (rest > 0) e.mem['rest'] = rest - 1;
      else if (distToHero(e, c) < RIME_RAVEN.sight) return 'shriek';
      const wp = mem(e, 'wp') % RING.length;
      const p = RING[wp] ?? { x: 1, y: 0 };
      if (
        flyTo(
          e,
          { x: h.x + p.x * RIME_RAVEN.radius, y: h.y + p.y * RIME_RAVEN.radius },
          RIME_RAVEN.circleSpeed,
        )
      )
        e.mem['wp'] = (wp + 1) % RING.length;
      return undefined;
    },
  },
  shriek: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      setAnim(e, 'tell');
      c.emit({ t: 'sfx', id: 'sfx_shriek' });
    },
    tick(e, c) {
      still(e);
      if (justHit(e)) return 'hurt';
      if (e.fsm.t < RIME_RAVEN.shriekTicks - 1) {
        faceHero(e, c);
        return undefined;
      }
      if (calledBy(e, c) === 0) callVargr(e, c, 1);
      lockAim(e, c);
      return 'dive';
    },
  },
  dive: {
    enter(e) {
      setAnim(e, 'dive');
    },
    tick(e) {
      if (e.fsm.t >= RIME_RAVEN.diveTicks - 1) {
        still(e);
        return 'climb';
      }
      const d = aim(e);
      e.vel = { x: d.x * RIME_RAVEN.diveSpeed, y: d.y * RIME_RAVEN.diveSpeed };
      return undefined;
    },
  },
  climb: {
    enter(e) {
      setAnim(e, 'fly');
    },
    tick(e) {
      if (justHit(e)) return 'hurt';
      const back = flyTo(e, home(e), RIME_RAVEN.climbSpeed);
      if (back || e.fsm.t >= RIME_RAVEN.climbTicks - 1) {
        e.mem['rest'] = RIME_RAVEN.restTicks;
        return 'circle';
      }
      return undefined;
    },
  },
  hurt: {
    enter(e) {
      still(e);
      setAnim(e, 'hurt');
    },
    tick(e) {
      still(e);
      return e.fsm.t >= RIME_RAVEN.hurtTicks - 1 ? 'climb' : undefined;
    },
  },
};
