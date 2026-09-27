import type { TerrainId } from '@content/terrain';
import { hashInts } from '../math/hash';
import type { Vec } from '../math/vec';
import { TILE } from './dims';
import type { DecorDef, TerrainDef } from './terrain';
import { MapError, type TerrainGrid } from './textmap';

/** One decor block: `w`×`h` tiles of `terrain` anchored at its top-left cell. */
export interface DecorPlacement {
  readonly terrain: TerrainId;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/**
 * Groups every decor terrain cell into footprint blocks, scanning row by row and claiming a full block at
 * each unclaimed cell. Maps must be drawn so that runs of the same character split into whole blocks; an
 * incomplete or overlapping block is a map error.
 */
export function decorPlacements(
  grid: TerrainGrid,
  defs: Readonly<Record<TerrainId, TerrainDef>>,
): DecorPlacement[] {
  const claimed = new Uint8Array(grid.cells.length);
  const out: DecorPlacement[] = [];
  for (let y = 0; y < grid.rows; y++) {
    for (let x = 0; x < grid.cols; x++) {
      const i = y * grid.cols + x;
      const t = grid.cells[i];
      if (t === undefined || claimed[i] === 1) continue;
      const decor = defs[t].decor;
      if (decor === undefined) continue;
      for (let dy = 0; dy < decor.h; dy++) {
        for (let dx = 0; dx < decor.w; dx++) {
          const cx = x + dx;
          const cy = y + dy;
          if (cx >= grid.cols || cy >= grid.rows)
            throw new MapError(`decor ${t} at ${x},${y} runs off the map`);
          const j = cy * grid.cols + cx;
          const cell = grid.cells[j];
          if (cell !== t)
            throw new MapError(`decor ${t} at ${x},${y} is incomplete: ${cx},${cy} is ${String(cell)}`);
          if (claimed[j] === 1)
            throw new MapError(`decor ${t} at ${x},${y} overlaps another block at ${cx},${cy}`);
          claimed[j] = 1;
        }
      }
      out.push({ terrain: t, x, y, w: decor.w, h: decor.h });
    }
  }
  return out;
}

/** Where a decor block stands: horizontally centred, 2 px above its bottom row (the same rule as tileFeet). */
export function decorFeet(p: DecorPlacement): Vec {
  return { x: (p.x + p.w / 2) * TILE, y: (p.y + p.h) * TILE - 2 };
}

/** The art key for a block: a stable pick among the definition's variants, salted per screen. */
export function decorArt(p: DecorPlacement, def: DecorDef, salt: number): string {
  const art = def.art[hashInts(p.x, p.y, salt) % def.art.length];
  if (art === undefined) throw new Error(`decor ${p.terrain} has no art`);
  return art;
}
