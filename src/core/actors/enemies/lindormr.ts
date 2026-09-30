import { nextInt } from '../../math/rng';
import { length, sub, type Vec } from '../../math/vec';
import { mem, setAnim, type Entity } from '../entity';
import type { Machine } from '../fsm';
import { aim, faceHero, lockAim, still, toHero, wallAhead } from './common';
import type { ActorCtx } from './defs';

export type LindormrState =
  'wake' | 'hidden' | 'rear' | 'ripple' | 'flushed' | 'coil' | 'charge' | 'dazed' | 'roar' | 'burrow';
export type MoundState = 'mound';

export const LINDORMR = {
  /** Where its four mud mounds rise, from its feet (the pond room puts them on the silt). */
  mounds: [
    { x: -112, y: -48 },
    { x: 112, y: -48 },
    { x: -112, y: 64 },
    { x: 112, y: 64 },
  ],
  /** Health at or below which each later phase begins (24 → phase 1 at 16, phase 2 at 8). */
  phaseAt: [16, 8],
  /**
   * Hidden this long between rearings: long enough to walk from the middle of the pond to a mound and
   * let a bomb's fuse (96 ticks) burn down before it rears and moves on.
   */
  hideTicks: 180,
  /** Reared up out of the mud before it spits (400 ms), then up a while longer. */
  rearTell: 24,
  rearTicks: 48,
  /** Phase 1 on: a second gob this long after the first. */
  spitGap: 12,
  /** Phase 1 on: the ripple of it moving underground to another mound. */
  rippleTicks: 40,
  /** Flushed out by a bomb: stunned, open to the blade. */
  flushTicks: 150,
  /** Phase 2: once flushed it coils (500 ms) and charges in a line; a wall dazes it. */
  coilTicks: 30,
  chargeSpeed: 3,
  /** A charge runs until it hits a wall; this only stops one that somehow never does. */
  chargeTicks: 150,
  dazedTicks: 90,
  roarTicks: 50,
  burrowTicks: 30,
  /** A broken mound grows back this long after it was blown apart, once Ask is this far (px) from it. */
  regrowTicks: 240,
  regrowClear: 28,
} as const;

const MOUND_IDS = ['m0', 'm1', 'm2', 'm3'] as const;
const GROW_IDS = ['g0', 'g1', 'g2', 'g3'] as const;

const phaseOf = (hp: number): number => LINDORMR.phaseAt.filter((at) => hp <= at).length;

function phaseChanged(e: Entity): boolean {
  const p = phaseOf(e.hp);
  if (p <= mem(e, 'phase')) return false;
  e.mem['phase'] = p;
  return true;
}

/** The mound standing at spot `i` (by the id Lindormr keeps for it), if it has not been blown apart. */
function moundAt(e: Entity, c: ActorCtx, i: number): Readonly<Entity> | undefined {
  const id = mem(e, MOUND_IDS[i] ?? 'm0');
  return id === 0 ? undefined : c.others.find((a) => a.id === id);
}

function spotPos(e: Entity, i: number): Vec {
  const s = LINDORMR.mounds[i] ?? { x: 0, y: 0 };
  return { x: mem(e, 'homeX') + s.x, y: mem(e, 'homeY') + s.y };
}

/** Raises a mound at spot `i`, marked with its spot so it knows when it hides Lindormr. */
function raise(e: Entity, c: ActorCtx, i: number): void {
  const m = c.spawn('lind_mound', spotPos(e, i), 's');
  m.mem['spot'] = i;
  e.mem[MOUND_IDS[i] ?? 'm0'] = m.id;
  e.mem[GROW_IDS[i] ?? 'g0'] = 0;
}

/** Blown-apart mounds grow back after a while, but never up under Ask's feet. */
function regrow(e: Entity, c: ActorCtx): void {
  LINDORMR.mounds.forEach((_, i) => {
    if (moundAt(e, c, i) !== undefined) return;
    const key = GROW_IDS[i] ?? 'g0';
    const t = Math.min(LINDORMR.regrowTicks, mem(e, key) + 1);
    e.mem[key] = t;
    if (t >= LINDORMR.regrowTicks && length(sub(spotPos(e, i), c.hero)) > LINDORMR.regrowClear)
      raise(e, c, i);
  });
}

/** A standing mound other than `not`, chosen at random; -1 when none stands. */
function pickMound(e: Entity, c: ActorCtx, not: number): number {
  const free = LINDORMR.mounds.map((_, i) => i).filter((i) => i !== not && moundAt(e, c, i) !== undefined);
  if (free.length === 0) return moundAt(e, c, not) === undefined ? -1 : not;
  return free[nextInt(c.rng, 0, free.length)] ?? -1;
}

/** Out of reach under the mud: no blow or blast touches it. */
function submerged(e: Entity): void {
  still(e);
  e.iframes = Math.max(e.iframes, 2);
  e.mem['guard'] = 1;
}

function spit(e: Entity, c: ActorCtx): void {
  c.shoot('spit', { x: e.pos.x, y: e.pos.y - 12 }, toHero(e, c));
}

/**
 * Lindormr, the serpent in the mill's mud. It hides in one of its four mud mounds, which bubbles, and
 * every three seconds rears up (400 ms) and spits. The mounds turn the blade; a bomb blows one apart, and
 * blowing up the one it hides in flushes it out, stunned (2.5 s) and open to the sword, before it burrows
 * into another. Blown mounds grow back. At two thirds of its health it moves underground after every
 * spit (a ripple), another mound bubbles as a decoy, and it spits twice; at the last third, once
 * flushed it coils (500 ms) and charges in a line, and a wall it runs into dazes it.
 */
export const LINDORMR_MACHINE: Machine<LindormrState, ActorCtx> = {
  wake: {
    tick(e, c) {
      e.mem['homeX'] = e.pos.x;
      e.mem['homeY'] = e.pos.y;
      e.mem['in'] = 0;
      e.mem['decoy'] = -1;
      for (let i = 0; i < LINDORMR.mounds.length; i++) raise(e, c, i);
      submerged(e);
      return 'hidden';
    },
  },
  hidden: {
    enter(e) {
      e.pos = spotPos(e, mem(e, 'in'));
      setAnim(e, 'hidden');
    },
    tick(e, c) {
      submerged(e);
      regrow(e, c);
      if (moundAt(e, c, mem(e, 'in')) === undefined) return 'flushed';
      return e.fsm.t >= LINDORMR.hideTicks - 1 ? 'rear' : undefined;
    },
  },
  rear: {
    enter(e, c) {
      faceHero(e, c);
      setAnim(e, 'tell');
    },
    tick(e, c) {
      still(e);
      e.mem['guard'] = 1;
      regrow(e, c);
      if (moundAt(e, c, mem(e, 'in')) === undefined) return 'flushed';
      faceHero(e, c);
      const t = e.fsm.t;
      if (t === LINDORMR.rearTell) {
        setAnim(e, 'rear');
        spit(e, c);
      }
      if (t === LINDORMR.rearTell + LINDORMR.spitGap && mem(e, 'phase') >= 1) spit(e, c);
      if (t < LINDORMR.rearTicks - 1) return undefined;
      return mem(e, 'phase') >= 1 ? 'ripple' : 'hidden';
    },
  },
  ripple: {
    enter(e, c) {
      const from = mem(e, 'in');
      const to = pickMound(e, c, from);
      e.mem['from'] = from;
      e.mem['in'] = to < 0 ? from : to;
      const decoy = pickMound(e, c, mem(e, 'in'));
      e.mem['decoy'] = decoy === mem(e, 'in') ? -1 : decoy;
      setAnim(e, 'ripple');
    },
    tick(e, c) {
      submerged(e);
      regrow(e, c);
      const a = spotPos(e, mem(e, 'from'));
      const b = spotPos(e, mem(e, 'in'));
      const k = Math.min(1, (e.fsm.t + 1) / LINDORMR.rippleTicks);
      e.pos = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
      if (e.fsm.t < LINDORMR.rippleTicks - 1) return undefined;
      return moundAt(e, c, mem(e, 'in')) === undefined ? 'burrow' : 'hidden';
    },
  },
  flushed: {
    enter(e, c) {
      still(e);
      e.iframes = 0;
      e.mem['guard'] = 0;
      e.mem['decoy'] = -1;
      setAnim(e, 'dazed');
      c.emit({ t: 'sfx', id: 'sfx_stun' });
    },
    tick(e, c) {
      still(e);
      regrow(e, c);
      if (phaseChanged(e)) return 'roar';
      if (e.fsm.t < LINDORMR.flushTicks - 1) return undefined;
      return mem(e, 'phase') >= 2 ? 'coil' : 'burrow';
    },
  },
  coil: {
    enter(e, c) {
      still(e);
      e.mem['guard'] = 1;
      faceHero(e, c);
      setAnim(e, 'coil');
      c.emit({ t: 'sfx', id: 'sfx_growl' });
    },
    tick(e, c) {
      still(e);
      regrow(e, c);
      if (e.fsm.t < LINDORMR.coilTicks - 1) {
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
      regrow(e, c);
      const d = aim(e);
      if (wallAhead(e, c, d, 14)) {
        still(e);
        c.emit({ t: 'shake', amount: 3 });
        return 'dazed';
      }
      if (e.fsm.t >= LINDORMR.chargeTicks - 1) {
        still(e);
        return 'burrow';
      }
      e.vel = { x: d.x * LINDORMR.chargeSpeed, y: d.y * LINDORMR.chargeSpeed };
      return undefined;
    },
  },
  dazed: {
    enter(e) {
      still(e);
      e.mem['guard'] = 0;
      setAnim(e, 'dazed');
    },
    tick(e, c) {
      still(e);
      regrow(e, c);
      if (phaseChanged(e)) return 'roar';
      return e.fsm.t >= LINDORMR.dazedTicks - 1 ? 'burrow' : undefined;
    },
  },
  roar: {
    enter(e, c) {
      still(e);
      e.mem['guard'] = 1;
      setAnim(e, 'roar');
      c.emit({ t: 'sfx', id: 'sfx_boss_roar' });
      c.emit({ t: 'shake', amount: 4 });
    },
    tick(e, c) {
      still(e);
      regrow(e, c);
      return e.fsm.t >= LINDORMR.roarTicks - 1 ? 'burrow' : undefined;
    },
  },
  burrow: {
    enter(e) {
      still(e);
      e.mem['guard'] = 1;
      setAnim(e, 'burrow');
    },
    tick(e, c) {
      still(e);
      regrow(e, c);
      if (e.fsm.t < LINDORMR.burrowTicks - 1) return undefined;
      // Into the nearest standing mound; with every mound blown apart it waits for one to grow back.
      let best = -1;
      let dist = Infinity;
      LINDORMR.mounds.forEach((_, i) => {
        const m = moundAt(e, c, i);
        if (m === undefined) return;
        const d = length(sub(m.pos, e.pos));
        if (d < dist) {
          dist = d;
          best = i;
        }
      });
      if (best < 0) return undefined;
      e.mem['in'] = best;
      return 'hidden';
    },
  },
};

/** A mound of mud: it bubbles while Lindormr hides in it (or, later, to fool Ask). */
export const MOUND_MACHINE: Machine<MoundState, ActorCtx> = {
  mound: {
    tick(e, c) {
      still(e);
      const worm = c.others.find((a) => a.def === 'lindormr');
      const spot = mem(e, 'spot');
      const hiding =
        worm !== undefined &&
        (worm.fsm.s === 'hidden' || worm.fsm.s === 'rear') &&
        (mem(worm, 'in') === spot || mem(worm, 'decoy') === spot);
      setAnim(e, hiding ? 'bubble' : 'idle');
      return undefined;
    },
  },
};
