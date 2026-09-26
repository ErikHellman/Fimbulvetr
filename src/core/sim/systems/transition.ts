import type { ScreenId } from '@content/world/screens';
import { setAnim } from '../../actors/entity';
import { at, type Box } from '../../math/box';
import type { Dir4 } from '../../math/dir';
import type { Vec } from '../../math/vec';
import { SCREEN_H, SCREEN_W, TILE } from '../../world/dims';
import { tileFeet, type DoorThing } from '../../world/screen';
import type { SimRt, Transition } from '../rt';
import { placeHero } from './hero';
import { spawnActors } from './spawn';

export const TRANSITION_TICKS = 30;
export const FADE_TICKS = 36;
const EDGE_INSET = 4;

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/**
 * Where the hero stands on the new screen after crossing an edge in direction `dir`. The other axis is
 * clamped into the screen, so a diagonal step through a corner cannot chain a second transition.
 */
export function entryPoint(dir: Dir4, from: Vec, body: Box): Vec {
  const y = clamp(from.y, -body.y, SCREEN_H - (body.y + body.h));
  const x = clamp(from.x, -body.x, SCREEN_W - (body.x + body.w));
  switch (dir) {
    case 'e':
      return { x: EDGE_INSET - body.x, y };
    case 'w':
      return { x: SCREEN_W - EDGE_INSET - (body.x + body.w), y };
    case 's':
      return { x, y: EDGE_INSET - body.y };
    case 'n':
      return { x, y: SCREEN_H - EDGE_INSET - (body.y + body.h) };
  }
}

export function markVisited(rt: SimRt, id: ScreenId): void {
  if (!rt.state.world.visited.includes(id)) rt.state.world.visited.push(id);
}

/** Makes `id` the live screen with fresh actors and the hero at `heroAt`. */
export function enterScreen(rt: SimRt, id: ScreenId, heroAt: Vec): void {
  rt.screen = rt.load(id);
  rt.actors = spawnActors(rt);
  placeHero(rt, heroAt);
}

/** Starts a slide when the hero's body leaves the screen toward a neighbour. */
export function checkEdges(rt: SimRt): void {
  const b = at(rt.hero.body, rt.hero.pos);
  let dir: Dir4 | null = null;
  if (b.x < 0) dir = 'w';
  else if (b.x + b.w > SCREEN_W) dir = 'e';
  else if (b.y < 0) dir = 'n';
  else if (b.y + b.h > SCREEN_H) dir = 's';
  if (dir === null) return;
  const to = rt.screen.neighbours[dir];
  if (to === null) return;
  const from = rt.screen.id;
  const heroFrom = { ...rt.hero.pos };
  const heroTo = entryPoint(dir, heroFrom, rt.db.tuning.hero.body);
  enterScreen(rt, to, heroTo);
  setAnim(rt.hero, 'walk');
  rt.transition = {
    kind: 'slide',
    from,
    to,
    dir,
    t: 0,
    dur: TRANSITION_TICKS,
    heroFrom,
    heroTo,
    facing: rt.hero.facing,
  };
  rt.mode = 'transition';
  rt.emit({ t: 'screenTransition', from, to, dir });
}

/** The door the hero is walking into, if any: feet on its tile while facing its direction. */
export function doorAt(rt: SimRt): DoorThing | null {
  const tx = Math.floor(rt.hero.pos.x / TILE);
  const ty = Math.floor((rt.hero.pos.y - 1) / TILE);
  for (const thing of rt.db.screens[rt.screen.id].things) {
    if (thing.k === 'door' && thing.at.x === tx && thing.at.y === ty && thing.dir === rt.hero.facing)
      return thing;
  }
  return null;
}

export function checkDoors(rt: SimRt): void {
  const door = doorAt(rt);
  if (door === null) return;
  const from = rt.screen.id;
  rt.hero.vel = { x: 0, y: 0 };
  setAnim(rt.hero, 'idle');
  rt.transition = {
    kind: 'fade',
    from,
    to: door.to,
    dir: door.dir,
    t: 0,
    dur: FADE_TICKS,
    heroFrom: { ...rt.hero.pos },
    heroTo: tileFeet(door.arrive),
    facing: door.facing,
  };
  rt.mode = 'transition';
  rt.emit({ t: 'screenTransition', from, to: door.to, dir: door.dir });
}

/** 0 = clear, 1 = black. */
export function fadeLevel(tr: Transition | null): number {
  if (tr?.kind !== 'fade') return 0;
  const half = tr.dur / 2;
  return tr.t <= half ? tr.t / half : Math.max(0, (tr.dur - tr.t) / half);
}

export function stepTransition(rt: SimRt): void {
  const tr = rt.transition;
  if (tr === null) {
    rt.mode = 'play';
    return;
  }
  tr.t += 1;
  if (tr.kind === 'slide') rt.hero.animT += 1;
  if (tr.kind === 'fade' && tr.t === tr.dur / 2) {
    enterScreen(rt, tr.to, tr.heroTo);
    rt.hero.facing = tr.facing;
    setAnim(rt.hero, 'idle');
  }
  if (tr.t < tr.dur) return;
  rt.transition = null;
  rt.mode = 'play';
  markVisited(rt, tr.to);
  rt.emit({ t: 'screenEntered', screen: tr.to });
  rt.emit({ t: 'autosave' });
}
