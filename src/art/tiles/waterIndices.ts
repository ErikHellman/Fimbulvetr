import type { TerrainId } from '@content/terrain';
import type { TerrainDef } from '@core/world/terrain';
import type { TerrainGrid } from '@core/world/textmap';
import { riseFooting } from '@core/world/water';
import type { Tileset } from './tileset';

/**
 * The water overlay of a screen at a water level, per cell: the flooded tile over a sluice floor under
 * water, the floated-planks tile over a race at the brim, and -1 elsewhere (dry sluices and sunken planks
 * show their own terrain).
 */
export function waterIndices(
  grid: TerrainGrid,
  terrain: Readonly<Record<TerrainId, TerrainDef>>,
  level: number,
  tileset: Tileset,
): number[] {
  return grid.cells.map((id) => {
    const rise = terrain[id].rise;
    if (rise === undefined) return -1;
    const footing = riseFooting(rise, level);
    if (rise.floods !== undefined) return footing ? -1 : tileset.water.flooded;
    return footing ? tileset.water.afloat : -1;
  });
}
