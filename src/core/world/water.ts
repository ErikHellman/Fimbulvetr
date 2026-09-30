import type { TerrainId } from '@content/terrain';
import type { TerrainDef, TerrainRise } from './terrain';
import type { TerrainGrid } from './textmap';

/**
 * Water levels (a mill's sluices, Sökkva Kvern): a screen whose `ScreenDef.water` names a level flag has
 * terrains that `rise` with it. A sluice floor is dry until the water reaches its level; the planks of a
 * race lie out of reach at the bottom of their channel until the water floats them up to the brim.
 */

/** Whether a rising terrain gives footing at `level`. */
export function riseFooting(rise: TerrainRise, level: number): boolean {
  if (rise.floods !== undefined) return level < rise.floods;
  if (rise.floats !== undefined) return level >= rise.floats;
  return true;
}

/** The footing of every rising tile of a grid at `level`, by tile index. */
export function levelPassage(
  grid: TerrainGrid,
  terrain: Readonly<Record<TerrainId, TerrainDef>>,
  level: number,
): Map<number, boolean> {
  const out = new Map<number, boolean>();
  grid.cells.forEach((id, i) => {
    const rise = terrain[id].rise;
    if (rise !== undefined) out.set(i, riseFooting(rise, level));
  });
  return out;
}
