import type { Vec } from './vec';

export const DIRS = ['n', 'e', 's', 'w'] as const;
export type Dir4 = (typeof DIRS)[number];

export const DIR_VEC: Readonly<Record<Dir4, Vec>> = {
  n: { x: 0, y: -1 },
  e: { x: 1, y: 0 },
  s: { x: 0, y: 1 },
  w: { x: -1, y: 0 },
};

const OPPOSITE: Readonly<Record<Dir4, Dir4>> = { n: 's', e: 'w', s: 'n', w: 'e' };
export const opposite = (d: Dir4): Dir4 => OPPOSITE[d];

/**
 * Facing for a movement vector. A clearly dominant axis wins; on near-diagonals the current facing is kept
 * when it is one of the two components (Zelda-style strafing feel).
 */
export function dirFromVec(v: Vec, current: Dir4): Dir4 {
  if (v.x === 0 && v.y === 0) return current;
  const horiz: Dir4 = v.x > 0 ? 'e' : 'w';
  const vert: Dir4 = v.y > 0 ? 's' : 'n';
  if (v.y === 0) return horiz;
  if (v.x === 0) return vert;
  const ax = Math.abs(v.x);
  const ay = Math.abs(v.y);
  if (ax >= 2 * ay) return horiz;
  if (ay >= 2 * ax) return vert;
  if (current === horiz || current === vert) return current;
  return ax >= ay ? horiz : vert;
}
