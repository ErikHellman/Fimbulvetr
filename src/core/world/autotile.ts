export const N = 1;
export const NE = 2;
export const E = 4;
export const SE = 8;
export const S = 16;
export const SW = 32;
export const W = 64;
export const NW = 128;

/** Drops diagonal bits whose two neighbouring cardinals are not both set (they cannot change the look). */
export function reduceMask(m: number): number {
  let r = m & (N | E | S | W);
  if ((m & NE) !== 0 && (m & N) !== 0 && (m & E) !== 0) r |= NE;
  if ((m & SE) !== 0 && (m & S) !== 0 && (m & E) !== 0) r |= SE;
  if ((m & SW) !== 0 && (m & S) !== 0 && (m & W) !== 0) r |= SW;
  if ((m & NW) !== 0 && (m & N) !== 0 && (m & W) !== 0) r |= NW;
  return r;
}

/** The 47 distinct reduced masks, ascending. Index 0 is an isolated tile, 46 a fully surrounded one. */
export const BLOB_MASKS: readonly number[] = (() => {
  const set = new Set<number>();
  for (let m = 0; m < 256; m++) set.add(reduceMask(m));
  return [...set].sort((a, b) => a - b);
})();

const INDEX = new Map(BLOB_MASKS.map((m, i) => [m, i]));

export function blobIndex(mask: number): number {
  const i = INDEX.get(reduceMask(mask));
  if (i === undefined) throw new Error(`no blob index for mask ${mask}`);
  return i;
}

/** 8-neighbour mask of cells where `same` holds. Out of bounds counts as same: terrain continues past the edge. */
export function neighbourMask(
  x: number,
  y: number,
  cols: number,
  rows: number,
  same: (x: number, y: number) => boolean,
): number {
  const s = (dx: number, dy: number): boolean => {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return true;
    return same(nx, ny);
  };
  return (
    (s(0, -1) ? N : 0) |
    (s(1, -1) ? NE : 0) |
    (s(1, 0) ? E : 0) |
    (s(1, 1) ? SE : 0) |
    (s(0, 1) ? S : 0) |
    (s(-1, 1) ? SW : 0) |
    (s(-1, 0) ? W : 0) |
    (s(-1, -1) ? NW : 0)
  );
}
