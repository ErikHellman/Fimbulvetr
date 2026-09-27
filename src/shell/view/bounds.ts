import type { Box } from '@core/math/box';

/** A drawn thing's rectangle in world pixels and its depth, for occlusion checks. */
export interface Bounds {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  readonly depth: number;
}

export const overlapsRect = (x: number, y: number, w: number, h: number, b: Bounds): boolean =>
  x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y;

export const overlaps = (a: Bounds, b: Bounds): boolean => overlapsRect(a.x, a.y, a.w, a.h, b);

/**
 * An entity's body as drawn: its hurt box placed at the drawn feet point. Frames carry transparent margin,
 * so the frame rectangle would count things beside the hero as covering it.
 */
export function bodyBounds(x: number, y: number, depth: number, hurt: Box): Bounds {
  return { x: x + hurt.x, y: y + hurt.y, w: hurt.w, h: hurt.h, depth };
}
