import { dirFromVec } from '../../math/dir';
import { length, normalize, sub, type Vec } from '../../math/vec';
import { TILE } from '../../world/dims';
import { mem, setAnim, type Entity } from '../entity';
import type { Machine } from '../fsm';
import { aim, faceHero, lockAim, still, toHero } from './common';
import type { ActorCtx } from './defs';

export type NykrState =
  'rise' | 'circle' | 'rear' | 'wave' | 'beached' | 'roar' | 'coil' | 'charge' | 'whirl';

/** Nykr's numbers: px, px per tick and ticks. */
export const NYKR = {
  /** Health at or below which each later phase begins (30 → phase 1 at 20, phase 2 at 10). */
  phaseAt: [20, 10],
  /** The corners of its round in the water about the island, from where it rose (clockwise). */
  ring: [
    { x: -128, y: -88 },
    { x: 128, y: -88 },
    { x: 128, y: 88 },
    { x: -128, y: 88 },
  ],
  speed: 1.2,
  /** Circling this long between rearings (phase 0) or charges (phase 1). */
  rearEvery: 150,
  /** Reared up (the tell, 667 ms): a Vindr gust now blows it onto the stone. */
  rearTell: 40,
  /** The wave it surges across the island when no gust came. */
  waveTicks: 24,
  /** Blown or dragged onto the stone: it slides up onto it, then flounders, open to the blade (2.5 s). */
  slideTicks: 16,
  beachTicks: 150,
  /** How far up the stone it lands: this share of the way from its round to the middle. */
  beach: 0.45,
  roarTicks: 50,
  /** Phase 1: it lowers its head (500 ms), then charges in a locked line through the water. */
  coilTicks: 30,
  chargeSpeed: 2.8,
  chargeTicks: 70,
  /** Phase 2: riding its whirlpool, it spits a gout of lake-water at Ask this often. */
  whirlEvery: 70,
} as const;

const N = NYKR.ring.length;

const phaseOf = (hp: number): number => NYKR.phaseAt.filter((at) => hp <= at).length;
const raising = (e: Entity): boolean => phaseOf(e.hp) > mem(e, 'phase');

const home = (e: Entity): Vec => ({ x: mem(e, 'homeX'), y: mem(e, 'homeY') });

function ringPos(e: Entity, i: number): Vec {
  const r = NYKR.ring[i] ?? { x: 0, y: 0 };
  return { x: mem(e, 'homeX') + r.x, y: mem(e, 'homeY') + r.y };
}

/** Out in deep water, rearing or riding the whirl: no blow lands. Gusts and hooks that miss their moment are lost. */
function guarded(e: Entity): void {
  still(e);
  e.iframes = Math.max(e.iframes, 2);
  e.mem['guard'] = 1;
}

/** Read and clear a mark: a gust that touched it (`mem.gust`) or the grapple on its bridle (`mem.hooked`). */
function took(e: Entity, key: 'gust' | 'hooked'): boolean {
  const v = mem(e, key) === 1;
  e.mem[key] = 0;
  return v;
}

/** Whether a point is somewhere it cannot swim or walk: a wall, not water. */
function blocked(c: ActorCtx, p: Vec): boolean {
  const tx = Math.floor(p.x / TILE);
  const ty = Math.floor((p.y - 1) / TILE);
  return c.solidAt(tx, ty) && !c.waterAt(tx, ty);
}

/** Swims its round: on toward the next corner, and the one after once there. */
function swim(e: Entity): void {
  const to = ringPos(e, mem(e, 'wp'));
  const d = sub(to, e.pos);
  const dist = length(d);
  if (dist <= NYKR.speed) {
    e.pos = to;
    e.mem['wp'] = (mem(e, 'wp') + 1) % N;
    return;
  }
  const step = normalize(d);
  e.facing = dirFromVec(step, e.facing);
  e.pos = { x: e.pos.x + step.x * NYKR.speed, y: e.pos.y + step.y * NYKR.speed };
}

/** The ring corner nearest to it. */
function nearest(e: Entity): number {
  let best = 0;
  let dist = Infinity;
  for (let i = 0; i < N; i++) {
    const d = length(sub(ringPos(e, i), e.pos));
    if (d < dist) {
      dist = d;
      best = i;
    }
  }
  return best;
}

/**
 * Thane Nykr, the Tide: a water horse as tall as a hall, weed in its mane and a rotten bridle on its head.
 * It rises out of its pool, roars, and swims a round about the stone island in the middle, where no blade
 * reaches it. Every so often it rears up (the tell): a Vindr gust then blows it up onto the stone, where it
 * flounders, open to the sword; else it surges a wave across the island. From two thirds of its health it
 * charges at Ask through the water in locked lines (a dive passes under) and rears after each; from the
 * last third it rides a whirlpool, spitting gouts of water, until the grapple hooks its bridle and drags
 * it onto the stone. Its death frees the captives.
 */
export const NYKR_MACHINE: Machine<NykrState, ActorCtx> = {
  rise: {
    tick(e, c) {
      // The first state is never entered, only ticked: it rises from where it was placed.
      if (mem(e, 'up') === 0) {
        e.mem['up'] = 1;
        e.mem['homeX'] = e.pos.x;
        e.mem['homeY'] = e.pos.y;
        e.mem['wp'] = 1;
        e.mem['phase'] = phaseOf(e.hp);
        e.pos = ringPos(e, 0);
        setAnim(e, 'rise');
        c.emit({ t: 'sfx', id: 'sfx_boss_roar' });
        c.emit({ t: 'shake', amount: 4 });
      }
      guarded(e);
      e.mem['gust'] = 0;
      e.mem['hooked'] = 0;
      if (e.fsm.t < NYKR.roarTicks - 1) return undefined;
      e.mem['rearCd'] = NYKR.rearEvery;
      return 'circle';
    },
  },
  circle: {
    enter(e) {
      setAnim(e, 'swim');
    },
    tick(e) {
      guarded(e);
      e.mem['gust'] = 0;
      e.mem['hooked'] = 0;
      swim(e);
      if (mem(e, 'phase') >= 2) return 'whirl';
      e.mem['rearCd'] = Math.max(0, mem(e, 'rearCd') - 1);
      if (mem(e, 'rearCd') > 0) return undefined;
      e.mem['rearCd'] = NYKR.rearEvery;
      return mem(e, 'phase') >= 1 ? 'coil' : 'rear';
    },
  },
  rear: {
    enter(e, c) {
      faceHero(e, c);
      setAnim(e, 'rear');
      c.emit({ t: 'sfx', id: 'sfx_growl' });
    },
    tick(e) {
      guarded(e);
      e.mem['hooked'] = 0;
      if (took(e, 'gust')) return 'beached';
      return e.fsm.t >= NYKR.rearTell - 1 ? 'wave' : undefined;
    },
  },
  wave: {
    enter(e, c) {
      setAnim(e, 'wave');
      c.emit({ t: 'sfx', id: 'sfx_splash' });
      c.emit({ t: 'shake', amount: 2 });
    },
    tick(e) {
      guarded(e);
      e.mem['gust'] = 0;
      e.mem['hooked'] = 0;
      if (e.fsm.t < NYKR.waveTicks - 1) return undefined;
      e.mem['wp'] = nearest(e);
      return 'circle';
    },
  },
  beached: {
    enter(e, c) {
      still(e);
      const h = home(e);
      e.mem['fromX'] = e.pos.x;
      e.mem['fromY'] = e.pos.y;
      e.mem['toX'] = h.x + (e.pos.x - h.x) * NYKR.beach;
      e.mem['toY'] = h.y + (e.pos.y - h.y) * NYKR.beach;
      e.iframes = 0;
      e.mem['guard'] = 0;
      setAnim(e, 'beached');
      c.emit({ t: 'sfx', id: 'sfx_stun' });
      c.emit({ t: 'shake', amount: 4 });
    },
    tick(e) {
      still(e);
      e.mem['guard'] = 0;
      e.mem['gust'] = 0;
      e.mem['hooked'] = 0;
      const k = Math.min(1, (e.fsm.t + 1) / NYKR.slideTicks);
      e.pos = {
        x: mem(e, 'fromX') + (mem(e, 'toX') - mem(e, 'fromX')) * k,
        y: mem(e, 'fromY') + (mem(e, 'toY') - mem(e, 'fromY')) * k,
      };
      if (raising(e)) return 'roar';
      if (e.fsm.t < NYKR.beachTicks - 1) return undefined;
      e.mem['wp'] = nearest(e);
      e.mem['rearCd'] = NYKR.rearEvery;
      return 'circle';
    },
  },
  roar: {
    enter(e, c) {
      e.mem['phase'] = phaseOf(e.hp);
      setAnim(e, 'rise');
      c.emit({ t: 'sfx', id: 'sfx_boss_roar' });
      c.emit({ t: 'shake', amount: 5 });
    },
    tick(e) {
      guarded(e);
      e.mem['gust'] = 0;
      e.mem['hooked'] = 0;
      if (e.fsm.t < NYKR.roarTicks - 1) return undefined;
      e.mem['wp'] = nearest(e);
      e.mem['rearCd'] = NYKR.rearEvery / 2;
      return 'circle';
    },
  },
  coil: {
    enter(e, c) {
      faceHero(e, c);
      setAnim(e, 'rear');
      c.emit({ t: 'sfx', id: 'sfx_growl' });
    },
    tick(e, c) {
      guarded(e);
      e.mem['gust'] = 0;
      e.mem['hooked'] = 0;
      if (e.fsm.t < NYKR.coilTicks - 1) {
        faceHero(e, c);
        return undefined;
      }
      lockAim(e, c);
      return 'charge';
    },
  },
  charge: {
    enter(e) {
      setAnim(e, 'charge');
    },
    tick(e, c) {
      e.iframes = Math.max(e.iframes, 2);
      e.mem['guard'] = 1;
      e.mem['gust'] = 0;
      e.mem['hooked'] = 0;
      const d = aim(e);
      e.facing = dirFromVec(d, e.facing);
      const next = { x: e.pos.x + d.x * (NYKR.chargeSpeed + 10), y: e.pos.y + d.y * (NYKR.chargeSpeed + 10) };
      if (blocked(c, next) || e.fsm.t >= NYKR.chargeTicks - 1) {
        still(e);
        return 'rear';
      }
      e.pos = { x: e.pos.x + d.x * NYKR.chargeSpeed, y: e.pos.y + d.y * NYKR.chargeSpeed };
      return undefined;
    },
  },
  whirl: {
    enter(e) {
      setAnim(e, 'whirl');
    },
    tick(e, c) {
      guarded(e);
      e.mem['gust'] = 0;
      if (took(e, 'hooked')) return 'beached';
      faceHero(e, c);
      if (e.fsm.t % NYKR.whirlEvery === NYKR.whirlEvery - 1)
        c.shoot('spit', { x: e.pos.x, y: e.pos.y - 20 }, toHero(e, c));
      return undefined;
    },
  },
};
