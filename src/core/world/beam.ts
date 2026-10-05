import { DIR_VEC, type Dir4 } from '../math/dir';
import { SCREEN_COLS, SCREEN_ROWS } from './dims';

/** How far a beam may run before it is let go (a loop of prisms never ends otherwise). */
export const BEAM_TILES = 60;

/** A prism's slant: `/` or `\`. */
export type Slant = '/' | '\\';

const SLASH: Readonly<Record<Dir4, Dir4>> = { e: 'n', n: 'e', w: 's', s: 'w' };
const BACK: Readonly<Record<Dir4, Dir4>> = { e: 's', s: 'e', w: 'n', n: 'w' };

/** The way a beam travelling `dir` leaves a prism slanted `slant`. */
export const prismTurn = (slant: Slant, dir: Dir4): Dir4 => (slant === '/' ? SLASH : BACK)[dir];

/** The other slant: what a struck prism turns to. */
export const otherSlant = (slant: Slant): Slant => (slant === '/' ? '\\' : '/');

/**
 * What a beam meets on a tile: it passes on, stops, turns (a prism or a raised mirror), or lights an eye
 * (and stops there).
 */
export type BeamMeet =
  | { readonly k: 'pass' }
  | { readonly k: 'stop' }
  | { readonly k: 'turn'; readonly dir: Dir4 }
  | { readonly k: 'eye'; readonly index: number };

/** One straight stretch of a beam, from tile to tile (both inclusive). */
export interface BeamRun {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

export interface BeamTrace {
  readonly runs: readonly BeamRun[];
  /** Every tile the beam crossed, as y * cols + x, in order (the window's own tile not counted). */
  readonly tiles: readonly number[];
  /** The eyes it lit (the `index` of each `eye` meet). */
  readonly eyes: readonly number[];
}

/**
 * Traces a beam from the window at (x, y) shining `dir`: tile by tile until the room's edge, something that
 * stops it, an eye, or `BEAM_TILES`. `meet` says what each tile does to a beam arriving travelling `dir`.
 */
export function traceBeam(
  x: number,
  y: number,
  dir: Dir4,
  meet: (x: number, y: number, dir: Dir4) => BeamMeet,
): BeamTrace {
  const runs: BeamRun[] = [];
  const tiles: number[] = [];
  const eyes: number[] = [];
  let [sx, sy] = [x, y];
  let [cx, cy] = [x, y];
  let d = dir;
  for (let n = 0; n < BEAM_TILES; n++) {
    const v = DIR_VEC[d];
    const nx = cx + v.x;
    const ny = cy + v.y;
    if (nx < 0 || ny < 0 || nx >= SCREEN_COLS || ny >= SCREEN_ROWS) break;
    const m = meet(nx, ny, d);
    if (m.k === 'stop') break;
    [cx, cy] = [nx, ny];
    tiles.push(cy * SCREEN_COLS + cx);
    if (m.k === 'eye') {
      eyes.push(m.index);
      break;
    }
    if (m.k === 'turn' && m.dir !== d) {
      runs.push({ x0: sx, y0: sy, x1: cx, y1: cy });
      [sx, sy] = [cx, cy];
      d = m.dir;
    }
  }
  if (cx !== sx || cy !== sy) runs.push({ x0: sx, y0: sy, x1: cx, y1: cy });
  return { runs, tiles, eyes };
}
