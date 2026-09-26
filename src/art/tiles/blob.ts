import { E, N, NE, NW, S, SE, SW, W, reduceMask } from '@core/world/autotile';

const TILE = 16;

function neighbourBit(dx: number, dy: number): number {
  if (dy < 0) return dx < 0 ? NW : dx > 0 ? NE : N;
  if (dy > 0) return dx < 0 ? SW : dx > 0 ? SE : S;
  return dx < 0 ? W : E;
}

/**
 * Is pixel (x, y) of a 16×16 tile inside the terrain region for this neighbour mask? The region is inset
 * `inset` px on sides without a same-terrain neighbour, notched at inner corners and rounded at outer ones.
 * Coordinates just outside the tile answer for the neighbour in that direction.
 */
export function insideBlob(mask: number, x: number, y: number, inset: number): boolean {
  const m = reduceMask(mask);
  if (x < 0 || y < 0 || x >= TILE || y >= TILE) {
    const dx = x < 0 ? -1 : x >= TILE ? 1 : 0;
    const dy = y < 0 ? -1 : y >= TILE ? 1 : 0;
    return (m & neighbourBit(dx, dy)) !== 0;
  }
  const n = (m & N) !== 0;
  const e = (m & E) !== 0;
  const s = (m & S) !== 0;
  const w = (m & W) !== 0;
  const far = TILE - 1 - inset;
  if (!n && y < inset) return false;
  if (!s && y > far) return false;
  if (!w && x < inset) return false;
  if (!e && x > far) return false;
  if (n && w && (m & NW) === 0 && x < inset && y < inset) return false;
  if (n && e && (m & NE) === 0 && x > far && y < inset) return false;
  if (s && w && (m & SW) === 0 && x < inset && y > far) return false;
  if (s && e && (m & SE) === 0 && x > far && y > far) return false;
  if (!n && !w && x === inset && y === inset) return false;
  if (!n && !e && x === far && y === inset) return false;
  if (!s && !w && x === inset && y === far) return false;
  if (!s && !e && x === far && y === far) return false;
  return true;
}

/** Inside, but touching the outside on a 4-neighbour: where the terrain's edge colour goes. */
export function onBlobEdge(mask: number, x: number, y: number, inset: number): boolean {
  if (!insideBlob(mask, x, y, inset)) return false;
  return (
    !insideBlob(mask, x - 1, y, inset) ||
    !insideBlob(mask, x + 1, y, inset) ||
    !insideBlob(mask, x, y - 1, inset) ||
    !insideBlob(mask, x, y + 1, inset)
  );
}
