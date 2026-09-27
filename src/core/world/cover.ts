import type { CoverId } from '@content/ids';
import type { Season } from '../clock/types';
import type { Box } from '../math/box';
import type { CoverSave } from '../state/gameState';
import { TILE } from './dims';

/** How the rules see a kind of ground cover. */
export interface CoverDef {
  readonly id: CoverId;
  /** Seasons it grows in; outside them the tile is bare. */
  readonly seasons: readonly Season[];
  /** Speed factor while wading through it uncut. */
  readonly slow: number;
  /** Pickups under it stay hidden (and cannot be taken) until it is cut. */
  readonly hides?: boolean;
  /** Blown away by the boomerang (and later Vindr), not only cut. */
  readonly blown?: boolean;
}

/** One screen's cover: `kind[i]` is 0 for none or 1 + index into the cover list; `cleared[i]` is 0 or 1. */
export interface CoverGrid {
  readonly cols: number;
  readonly rows: number;
  readonly kind: Uint8Array;
  readonly cleared: Uint8Array;
  /** The season epoch this grid was built for; a new epoch means everything regrew. */
  readonly epoch: number;
}

export function buildCover(
  map: readonly string[],
  legend: Readonly<Record<string, CoverId>>,
  order: readonly CoverId[],
  defs: Readonly<Record<CoverId, CoverDef>>,
  season: Season,
  epoch: number,
  save: CoverSave | undefined,
): CoverGrid {
  const rows = map.length;
  const cols = map[0]?.length ?? 0;
  const kind = new Uint8Array(cols * rows);
  map.forEach((line, y) => {
    for (let x = 0; x < cols; x++) {
      const id = legend[line.charAt(x)];
      if (id !== undefined && defs[id].seasons.includes(season)) kind[y * cols + x] = order.indexOf(id) + 1;
    }
  });
  const cleared =
    save !== undefined && save.epoch === epoch
      ? decodeBits(save.cleared, cols * rows)
      : new Uint8Array(cols * rows);
  return { cols, rows, kind, cleared, epoch };
}

/** The cover standing (uncut) on a tile, or null. */
export function coverAt(g: CoverGrid, order: readonly CoverId[], tx: number, ty: number): CoverId | null {
  if (tx < 0 || ty < 0 || tx >= g.cols || ty >= g.rows) return null;
  const i = ty * g.cols + tx;
  const k = g.kind[i] ?? 0;
  if (k === 0 || g.cleared[i] === 1) return null;
  return order[k - 1] ?? null;
}

/** Cuts all standing cover whose tile overlaps `box`. Returns the tile indices cut. */
export function cutBox(g: CoverGrid, box: Box): number[] {
  const out: number[] = [];
  const x0 = Math.max(0, Math.floor(box.x / TILE));
  const x1 = Math.min(g.cols - 1, Math.floor((box.x + box.w - 1e-6) / TILE));
  const y0 = Math.max(0, Math.floor(box.y / TILE));
  const y1 = Math.min(g.rows - 1, Math.floor((box.y + box.h - 1e-6) / TILE));
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const i = ty * g.cols + tx;
      if ((g.kind[i] ?? 0) !== 0 && g.cleared[i] === 0) {
        g.cleared[i] = 1;
        out.push(i);
      }
    }
  }
  return out;
}

/** Packs bits into lowercase hex, 4 bits per character, first cell in the lowest bit. */
export function encodeBits(bits: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bits.length; i += 4) {
    let n = 0;
    for (let b = 0; b < 4; b++) if (bits[i + b] === 1) n |= 1 << b;
    out += n.toString(16);
  }
  return out.replace(/0+$/, '');
}

/** The inverse of encodeBits. Never throws: bad characters count as 0, and length is fitted to `n`. */
export function decodeBits(hex: string, n: number): Uint8Array {
  const bits = new Uint8Array(n);
  for (let c = 0; c < hex.length && c * 4 < n; c++) {
    const v = parseInt(hex.charAt(c), 16);
    if (Number.isNaN(v)) continue;
    for (let b = 0; b < 4 && c * 4 + b < n; b++) if ((v >> b) & 1) bits[c * 4 + b] = 1;
  }
  return bits;
}
