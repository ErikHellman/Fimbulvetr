import { dirFromVec } from '../../math/dir';
import { add, length, normalize, scale, sub, type Vec } from '../../math/vec';
import { TILE } from '../../world/dims';
import { mem, setAnim, type Entity } from '../entity';
import type { Machine } from '../fsm';
import { distToHero, faceHero, still, toHero } from './common';
import type { ActorCtx } from './defs';

export type NykrFoalState = 'circle' | 'stalk' | 'rear' | 'lunge' | 'flounder' | 'back';

/** A nykr foal's numbers: px, px per tick and ticks. */
export const NYKR_FOAL = {
  /** The ring it swims round its home spot, and how fast. */
  radius: 24,
  circleSpeed: 0.8,
  /** How near Ask must come before it swims at them under the water, and how fast. */
  sight: 104,
  stalkSpeed: 1.2,
  stalkTicks: 180,
  /** Near enough to rear up and lunge. */
  reach: 52,
  /** Head and forelegs up out of the water (the tell): 400 ms. */
  rearTicks: 24,
  lungeSpeed: 2.8,
  lungeTicks: 16,
  /** Stranded on the bank, thrashing and open to the blade. */
  flounderTicks: 90,
  backSpeed: 0.9,
  /** Under the water after a lunge before it may come again. */
  restTicks: 90,
} as const;

/** Whether the foal's feet are in open deep water. */
function wet(e: Entity, c: ActorCtx, p: Vec = e.pos): boolean {
  return c.waterAt(Math.floor(p.x / TILE), Math.floor((p.y - 1) / TILE));
}

/** Swims toward `target` without leaving the water (sliding along the bank). */
function swimTo(e: Entity, c: ActorCtx, target: Vec, speed: number): void {
  const want = sub(target, e.pos);
  if (length(want) < 1) {
    still(e);
    return;
  }
  const d = normalize(want);
  const options: Vec[] = [d, { x: Math.sign(d.x), y: 0 }, { x: 0, y: Math.sign(d.y) }].filter(
    (v) => length(v) > 0.2,
  );
  const free = options.find((v) => wet(e, c, add(e.pos, scale(normalize(v), 8))));
  e.vel = free === undefined ? { x: 0, y: 0 } : scale(normalize(free), speed);
  e.facing = dirFromVec(d, e.facing);
}

/** Under the water nothing reaches it. */
function under(e: Entity): void {
  setAnim(e, 'under');
  e.iframes = Math.max(e.iframes, 2);
}

/**
 * A nykr foal, a small grey water horse of Sævatn with a mane of weed. It circles its home under the
 * surface, out of reach; when Ask comes near it swims at them, rears up out of the water (the tell) and
 * lunges, up onto the bank if Ask stands there. Stranded, it flounders, open to the blade, then drags
 * itself back under. (M7b: a Vindr gust knocks it ashore.)
 */
export const NYKR_FOAL_MACHINE: Machine<NykrFoalState, ActorCtx> = {
  circle: {
    tick(e, c) {
      // The start state: `enter` does not run at spawn, so the pose and home are set here.
      under(e);
      if (e.mem['homeX'] === undefined) {
        e.mem['homeX'] = e.pos.x;
        e.mem['homeY'] = e.pos.y;
      }
      const home = { x: mem(e, 'homeX'), y: mem(e, 'homeY') };
      const r = sub(e.pos, home);
      const out = length(r) < 1 ? { x: 1, y: 0 } : normalize(r);
      // Round the ring: along the tangent, pulled back onto the ring's line.
      const pull = (NYKR_FOAL.radius - length(r)) / NYKR_FOAL.radius;
      const way = add({ x: -out.y, y: out.x }, scale(out, pull));
      swimTo(e, c, add(e.pos, scale(way, 16)), NYKR_FOAL.circleSpeed);
      const rest = mem(e, 'rest');
      if (rest > 0) e.mem['rest'] = rest - 1;
      return rest <= 0 && distToHero(e, c) < NYKR_FOAL.sight ? 'stalk' : undefined;
    },
  },
  stalk: {
    tick(e, c) {
      under(e);
      swimTo(e, c, c.hero, NYKR_FOAL.stalkSpeed);
      if (distToHero(e, c) < NYKR_FOAL.reach) return 'rear';
      return e.fsm.t >= NYKR_FOAL.stalkTicks || distToHero(e, c) > NYKR_FOAL.sight * 1.5 ? 'back' : undefined;
    },
  },
  rear: {
    enter(e, c) {
      still(e);
      faceHero(e, c);
      setAnim(e, 'tell');
      c.emit({ t: 'sfx', id: 'sfx_splash' });
    },
    tick(e, c) {
      still(e);
      faceHero(e, c);
      return e.fsm.t >= NYKR_FOAL.rearTicks - 1 ? 'lunge' : undefined;
    },
  },
  lunge: {
    enter(e, c) {
      setAnim(e, 'lunge');
      e.vel = scale(toHero(e, c), NYKR_FOAL.lungeSpeed);
    },
    tick(e, c) {
      if (e.fsm.t < NYKR_FOAL.lungeTicks - 1) return undefined;
      still(e);
      if (wet(e, c)) {
        e.mem['rest'] = NYKR_FOAL.restTicks;
        return 'circle';
      }
      return 'flounder';
    },
  },
  flounder: {
    enter(e) {
      still(e);
      setAnim(e, 'flounder');
    },
    tick(e) {
      still(e);
      return e.fsm.t >= NYKR_FOAL.flounderTicks - 1 ? 'back' : undefined;
    },
  },
  back: {
    enter(e) {
      setAnim(e, 'walk');
    },
    tick(e, c) {
      const home = { x: mem(e, 'homeX'), y: mem(e, 'homeY') };
      const want = sub(home, e.pos);
      e.vel = length(want) < 1 ? { x: 0, y: 0 } : scale(normalize(want), NYKR_FOAL.backSpeed);
      e.facing = dirFromVec(want, e.facing);
      if (!wet(e, c)) return undefined;
      e.mem['rest'] = NYKR_FOAL.restTicks;
      return 'circle';
    },
  },
};
