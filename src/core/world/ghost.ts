import type { TerrainId } from '@content/terrain';
import type { TerrainDef } from './terrain';
import type { TilePos } from './screen';
import type { TerrainGrid } from './textmap';
import { SCREEN_COLS } from './dims';

/** How far the lantern's light shows a hidden floor round Ask, and a burning brazier's round itself. */
export const GHOST_LANTERN = 40;
export const GHOST_BRAZIER = 56;

export interface GhostLight {
  readonly x: number;
  readonly y: number;
  readonly r: number;
}

/**
 * The hidden-floor tiles (`TerrainDef.hidden`: the barrow's ghost floor, Niflmýrr's drowned path) whose centres lie within one of the lights. The sim never cares:
 * a ghost floor is floor. Only the picture needs to know which ones show.
 */
export function shownGhosts(
  grid: TerrainGrid,
  terrain: Readonly<Record<TerrainId, TerrainDef>>,
  lights: readonly GhostLight[],
): TilePos[] {
  if (lights.length === 0) return [];
  const out: TilePos[] = [];
  grid.cells.forEach((cell, i) => {
    if (terrain[cell].hidden !== true || terrain[cell].solid) return;
    const x = i % SCREEN_COLS;
    const y = Math.floor(i / SCREEN_COLS);
    const cx = x * 16 + 8;
    const cy = y * 16 + 8;
    if (lights.some((l) => (l.x - cx) ** 2 + (l.y - cy) ** 2 <= l.r ** 2)) out.push({ x, y });
  });
  return out;
}
