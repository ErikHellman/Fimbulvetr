import { nextInt } from '../../math/rng';
import { dirFromVec, type Dir4 } from '../../math/dir';
import { length, normalize, scale, sub, type Vec } from '../../math/vec';
import { TILE } from '../../world/dims';
import { mem, type Entity } from '../entity';
import type { ActorCtx } from './defs';

/** Shared movement and senses for enemy behaviours. */

export const distToHero = (e: Entity, c: ActorCtx): number => length(sub(c.hero, e.pos));

export function toHero(e: Entity, c: ActorCtx): Vec {
  const d = sub(c.hero, e.pos);
  return length(d) === 0 ? { x: 0, y: 1 } : normalize(d);
}

export function faceHero(e: Entity, c: ActorCtx): void {
  e.facing = dirFromVec(toHero(e, c), e.facing);
}

export function still(e: Entity): void {
  e.vel = { x: 0, y: 0 };
}

/** Whether the tile `reach` px ahead of the feet (just above them) is a wall. */
export function wallAhead(e: Entity, c: ActorCtx, d: Vec, reach = 10): boolean {
  return c.solidAt(
    Math.floor((e.pos.x + d.x * reach) / TILE),
    Math.floor((e.pos.y - 4 + d.y * reach) / TILE),
  );
}

/** Walks toward `target`, turning along walls instead of pressing into them. */
export function steerTo(e: Entity, c: ActorCtx, target: Vec, speed: number): void {
  const want = sub(target, e.pos);
  if (length(want) < 1) {
    still(e);
    return;
  }
  const d = normalize(want);
  const options: Vec[] = [d, { x: Math.sign(d.x), y: 0 }, { x: 0, y: Math.sign(d.y) }].filter(
    (v) => length(v) > 0.2,
  );
  const free = options.find((v) => !wallAhead(e, c, normalize(v)));
  if (free === undefined) {
    still(e);
    return;
  }
  e.vel = scale(normalize(free), speed);
  e.facing = dirFromVec(d, e.facing);
}

const ROAM: readonly Vec[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: 0, y: 0 },
];

/**
 * Ambles about its home spot: a new random heading every 1–2 s, back toward home when it strays past
 * `range`. The home is the spawn point, remembered on first use.
 */
export function roam(e: Entity, c: ActorCtx, speed: number, range: number): void {
  if (e.mem['homeX'] === undefined) {
    e.mem['homeX'] = e.pos.x;
    e.mem['homeY'] = e.pos.y;
  }
  const left = mem(e, 'timer');
  if (left > 0) {
    e.mem['timer'] = left - 1;
    if ((e.vel.x !== 0 || e.vel.y !== 0) && wallAhead(e, c, normalize(e.vel))) still(e);
    return;
  }
  const home = { x: mem(e, 'homeX'), y: mem(e, 'homeY') };
  const d =
    length(sub(home, e.pos)) > range ? normalize(sub(home, e.pos)) : ROAM[nextInt(c.rng, 0, ROAM.length)];
  e.vel = scale(d ?? { x: 0, y: 0 }, speed);
  e.facing = dirFromVec(e.vel, e.facing);
  e.mem['timer'] = nextInt(c.rng, 60, 120);
}

/** Locks in the direction of a charge (toward the hero now) so a dodge can beat it. */
export function lockAim(e: Entity, c: ActorCtx): void {
  const d = toHero(e, c);
  e.mem['aimX'] = d.x;
  e.mem['aimY'] = d.y;
  e.facing = dirFromVec(d, e.facing);
}

export const aim = (e: Entity): Vec => ({ x: mem(e, 'aimX'), y: mem(e, 'aimY') });

/** A hit just landed on it this tick (resolveHit sets the flash). */
export const justHit = (e: Entity): boolean => e.flash > 0 && e.iframes > 0;

export const facingOf = (v: Vec, current: Dir4): Dir4 => dirFromVec(v, current);
