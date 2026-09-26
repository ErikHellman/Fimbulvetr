import type { TerrainId } from '@content/terrain';
import { overlaps, type Box } from '../math/box';
import { TILE } from './dims';
import type { TerrainDef } from './terrain';
import type { TerrainGrid } from './textmap';

export const SOLID = 1;
/** How far (px) a blocked mover is nudged sideways around a corner it only clips. */
export const CORNER_SLIDE = 6;
const EPS = 1e-6;

export interface CollisionGrid {
  readonly cols: number;
  readonly rows: number;
  readonly flags: Uint8Array;
}

export type SolidAt = (tx: number, ty: number) => boolean;

export function buildCollision(
  grid: TerrainGrid,
  defs: Readonly<Record<TerrainId, TerrainDef>>,
): CollisionGrid {
  const flags = new Uint8Array(grid.cols * grid.rows);
  grid.cells.forEach((terrain, i) => {
    flags[i] = defs[terrain].solid ? SOLID : 0;
  });
  return { cols: grid.cols, rows: grid.rows, flags };
}

/** Solidity lookup for a grid; tiles outside it are answered by `outside`. */
export function gridSolidAt(g: CollisionGrid, outside: SolidAt): SolidAt {
  return (tx, ty) => {
    if (tx < 0 || ty < 0 || tx >= g.cols || ty >= g.rows) return outside(tx, ty);
    return ((g.flags[ty * g.cols + tx] ?? 0) & SOLID) !== 0;
  };
}

export function boxHitsSolid(b: Box, solidAt: SolidAt, obstacles: readonly Box[] = []): boolean {
  const x0 = Math.floor(b.x / TILE);
  const x1 = Math.floor((b.x + b.w - EPS) / TILE);
  const y0 = Math.floor(b.y / TILE);
  const y1 = Math.floor((b.y + b.h - EPS) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (solidAt(tx, ty)) return true;
    }
  }
  return obstacles.some((o) => overlaps(b, o));
}

export interface MoveResult {
  readonly x: number;
  readonly y: number;
  readonly blockedX: boolean;
  readonly blockedY: boolean;
}

/**
 * Moves a box by (dx, dy) against solid tiles and obstacle boxes: X first, then Y, at most one pixel per
 * step so nothing tunnels. When blocked while moving along a single axis, it corner-slides (see `nudge`).
 */
export function moveBox(
  box: Box,
  dx: number,
  dy: number,
  solidAt: SolidAt,
  obstacles: readonly Box[] = [],
  slide: number = CORNER_SLIDE,
): MoveResult {
  const free = (x: number, y: number): boolean =>
    !boxHitsSolid({ x, y, w: box.w, h: box.h }, solidAt, obstacles);
  let x = box.x;
  let y = box.y;
  let blockedX = false;
  let blockedY = false;

  let rest = dx;
  while (rest !== 0) {
    const step = Math.abs(rest) >= 1 ? Math.sign(rest) : rest;
    if (free(x + step, y)) {
      x += step;
      rest -= step;
      continue;
    }
    blockedX = true;
    x += snapToWall(x, step, (to) => free(to, y));
    if (dy === 0) y += nudge(x, y, Math.sign(step), 0, free, slide);
    break;
  }

  rest = dy;
  while (rest !== 0) {
    const step = Math.abs(rest) >= 1 ? Math.sign(rest) : rest;
    if (free(x, y + step)) {
      y += step;
      rest -= step;
      continue;
    }
    blockedY = true;
    y += snapToWall(y, step, (to) => free(x, to));
    if (dx === 0) x += nudge(x, y, 0, Math.sign(step), free, slide);
    break;
  }

  return { x, y, blockedX, blockedY };
}

/** From a fractional position, a whole-pixel step can be blocked while the rest of the pixel is free. */
function snapToWall(pos: number, step: number, freeAt: (to: number) => boolean): number {
  const snap = step > 0 ? Math.ceil(pos) - pos : Math.floor(pos) - pos;
  return snap !== 0 && freeAt(pos + snap) ? snap : 0;
}

/**
 * Blocked while moving along one axis (sx or sy is ±1): if shifting up to `slide` px sideways would clear
 * the obstacle, return a 1 px step toward that side; otherwise 0.
 */
function nudge(
  x: number,
  y: number,
  sx: number,
  sy: number,
  free: (x: number, y: number) => boolean,
  slide: number,
): number {
  for (let k = 1; k <= slide; k++) {
    for (const side of [-1, 1]) {
      const ox = sy !== 0 ? side * k : 0;
      const oy = sx !== 0 ? side * k : 0;
      const clears = free(x + ox, y + oy) && free(x + ox + sx, y + oy + sy);
      const firstStepFree = free(x + Math.sign(ox), y + Math.sign(oy));
      if (clears && firstStepFree) return side;
    }
  }
  return 0;
}
