import type { RegionId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import type { ScreenDef, WorldLayout } from './screen';

/** One screen on the pause-menu map. */
export interface MapCell {
  readonly gx: number;
  readonly gy: number;
  readonly id: ScreenId;
  readonly region: RegionId;
  readonly visited: boolean;
  /** The hero is on this screen (or inside a house entered from it). */
  readonly here: boolean;
}

export interface MapModel {
  readonly cells: readonly MapCell[];
  /** The grid rectangle worth drawing: every visited cell plus the hero's (inclusive). */
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

/** The on-grid screen a screen belongs to: itself, or the screen whose door leads into it (an interior). */
export function gridScreenOf(
  layout: WorldLayout,
  screens: Readonly<Record<ScreenId, ScreenDef>>,
  id: ScreenId,
): ScreenId | null {
  if (layout.at[id] !== undefined) return id;
  const seen = new Set<ScreenId>([id]);
  let frontier: ScreenId[] = [id];
  while (frontier.length > 0) {
    const next: ScreenId[] = [];
    for (const def of Object.values(screens)) {
      if (seen.has(def.id)) continue;
      if (!def.things.some((t) => t.k === 'door' && frontier.includes(t.to))) continue;
      if (layout.at[def.id] !== undefined) return def.id;
      seen.add(def.id);
      next.push(def.id);
    }
    frontier = next;
  }
  return null;
}

/** The overworld as the pause menu shows it: every grid screen, which were visited, and where the hero is. */
export function overworldMap(
  layout: WorldLayout,
  screens: Readonly<Record<ScreenId, ScreenDef>>,
  visited: readonly ScreenId[],
  current: ScreenId,
): MapModel {
  const here = gridScreenOf(layout, screens, current);
  const cells: MapCell[] = [];
  for (const [id, pos] of Object.entries(layout.at) as [ScreenId, readonly [number, number] | undefined][]) {
    if (pos === undefined) continue;
    cells.push({
      gx: pos[0],
      gy: pos[1],
      id,
      region: screens[id].region,
      visited: visited.includes(id),
      here: id === here,
    });
  }
  cells.sort((a, b) => a.gy - b.gy || a.gx - b.gx);
  const shown = cells.filter((c) => c.visited || c.here);
  const xs = shown.map((c) => c.gx);
  const ys = shown.map((c) => c.gy);
  return {
    cells,
    x0: xs.length === 0 ? 0 : Math.min(...xs),
    y0: ys.length === 0 ? 0 : Math.min(...ys),
    x1: xs.length === 0 ? 0 : Math.max(...xs),
    y1: ys.length === 0 ? 0 : Math.max(...ys),
  };
}
