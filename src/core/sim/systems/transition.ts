import type { ScreenId } from '@content/world/screens';
import { setAnim } from '../../actors/entity';
import { at, type Box } from '../../math/box';
import type { Dir4 } from '../../math/dir';
import type { Vec } from '../../math/vec';
import { SCREEN_H, SCREEN_W } from '../../world/dims';
import type { SimRt } from '../rt';
import { placeHero } from './hero';
import { spawnActors } from './spawn';

export const TRANSITION_TICKS = 30;
const EDGE_INSET = 4;

/** Where the hero stands on the new screen after crossing an edge in direction `dir`. */
export function entryPoint(dir: Dir4, from: Vec, body: Box): Vec {
  switch (dir) {
    case 'e':
      return { x: EDGE_INSET - body.x, y: from.y };
    case 'w':
      return { x: SCREEN_W - EDGE_INSET - (body.x + body.w), y: from.y };
    case 's':
      return { x: from.x, y: EDGE_INSET - body.y };
    case 'n':
      return { x: from.x, y: SCREEN_H - EDGE_INSET - (body.y + body.h) };
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
  rt.transition = { from, to, dir, t: 0, dur: TRANSITION_TICKS, heroFrom, heroTo };
  rt.mode = 'transition';
  rt.emit({ t: 'screenTransition', from, to, dir });
}

export function stepTransition(rt: SimRt): void {
  const tr = rt.transition;
  if (tr === null) {
    rt.mode = 'play';
    return;
  }
  tr.t += 1;
  rt.hero.animT += 1;
  if (tr.t < tr.dur) return;
  rt.transition = null;
  rt.mode = 'play';
  markVisited(rt, tr.to);
  rt.emit({ t: 'screenEntered', screen: tr.to });
}
