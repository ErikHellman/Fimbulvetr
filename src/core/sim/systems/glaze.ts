import { DIR_VEC, dirFromVec, type Dir4 } from '../../math/dir';
import { mem } from '../../actors/entity';
import { TILE } from '../../world/dims';
import type { SimRt } from '../rt';

const SLIDE_DIRS: readonly Dir4[] = ['n', 'e', 's', 'w'];

/** Whether the tile under Ask's feet is glaze. */
export function onGlaze(rt: SimRt): boolean {
  const { terrain } = rt.screen;
  const tx = Math.floor(rt.hero.pos.x / TILE);
  const ty = Math.floor((rt.hero.pos.y - 1) / TILE);
  if (tx < 0 || ty < 0 || tx >= terrain.cols || ty >= terrain.rows) return false;
  const id = terrain.cells[ty * terrain.cols + tx];
  return id !== undefined && rt.db.terrain[id].glaze === true;
}

/** The way Ask is sliding, or null. Kept in `mem.slide` (0 none, then n, e, s, w). */
export function slideDir(rt: SimRt): Dir4 | null {
  return SLIDE_DIRS[mem(rt.hero, 'slide') - 1] ?? null;
}

export function stopSlide(rt: SimRt): void {
  if (mem(rt.hero, 'slide') !== 0) rt.hero.mem['slide'] = 0;
}

/**
 * Glaze (M9), before Ask moves: a step onto it (or a push of the stick on it) starts a slide that way,
 * lined up on the tile's middle; a slide overrides the stick. Hurt or swimming ends it.
 */
export function startSlide(rt: SimRt): void {
  const h = rt.hero;
  const s = h.fsm.s;
  if (s === 'hurt' || s === 'dying' || s === 'swim' || s === 'dive' || s === 'hop' || !onGlaze(rt)) {
    stopSlide(rt);
    return;
  }
  const dir = slideDir(rt) ?? beginSlide(rt);
  if (dir === null) return;
  const v = DIR_VEC[dir];
  const speed = rt.db.tuning.hero.slide;
  h.vel = { x: v.x * speed, y: v.y * speed };
}

/** Ask on foot, on glaze and walking: the slide begins the way Ask walks, lined up on the tile. */
function beginSlide(rt: SimRt): Dir4 | null {
  const h = rt.hero;
  if (h.fsm.s !== 'move' || (h.vel.x === 0 && h.vel.y === 0) || !onGlaze(rt)) return null;
  const dir = dirFromVec(h.vel, h.facing);
  h.mem['slide'] = SLIDE_DIRS.indexOf(dir) + 1;
  const tx = Math.floor(h.pos.x / TILE);
  const ty = Math.floor((h.pos.y - 1) / TILE);
  if (dir === 'n' || dir === 's') h.pos = { x: tx * TILE + TILE / 2, y: h.pos.y };
  else h.pos = { x: h.pos.x, y: ty * TILE + TILE - 2 };
  h.facing = dir;
  rt.emit({ t: 'sfx', id: 'sfx_slide' });
  return dir;
}

/**
 * After Ask moves: a walk that has just stepped onto glaze starts sliding; a slide that was stopped short
 * (a wall, a rock) or has left the ice ends.
 */
export function endSlide(rt: SimRt, before: { x: number; y: number }): void {
  const dir = slideDir(rt);
  if (dir === null) {
    beginSlide(rt);
    return;
  }
  const v = DIR_VEC[dir];
  const moved = (rt.hero.pos.x - before.x) * v.x + (rt.hero.pos.y - before.y) * v.y;
  if (moved < rt.db.tuning.hero.slide / 2 || !onGlaze(rt)) {
    stopSlide(rt);
    rt.hero.vel = { x: 0, y: 0 };
  }
}
