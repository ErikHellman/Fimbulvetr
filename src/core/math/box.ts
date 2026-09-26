import type { Vec } from './vec';

/** Axis-aligned box; (x, y) is the top-left corner. */
export interface Box {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** Touching edges do not overlap. */
export const overlaps = (a: Box, b: Box): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export const translate = (b: Box, dx: number, dy: number): Box => ({
  x: b.x + dx,
  y: b.y + dy,
  w: b.w,
  h: b.h,
});

/** A box given relative to an anchor point, placed at `p`. */
export const at = (rel: Box, p: Vec): Box => ({ x: p.x + rel.x, y: p.y + rel.y, w: rel.w, h: rel.h });
