import type { DungeonId, EnemyId, RegionId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import type { EnemyDef } from '../actors/enemies/defs';
import { peekDungeon } from '../state/dungeons';
import type { GameState } from '../state/gameState';
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

/** One room on a dungeon's map. */
export interface DungeonCell {
  readonly gx: number;
  readonly gy: number;
  readonly id: ScreenId;
  readonly visited: boolean;
  /** Drawn: visited, or every room once the map is found. */
  readonly shown: boolean;
  readonly here: boolean;
  /** Compass: the lair of a living boss. */
  readonly boss: boolean;
  /** Compass: a chest not yet opened (hidden ones too). */
  readonly chest: boolean;
}

export interface DungeonMapModel {
  readonly dungeon: DungeonId;
  readonly cols: number;
  readonly rows: number;
  readonly cells: readonly DungeonCell[];
  readonly keys: number;
  readonly bigKey: boolean;
  readonly map: boolean;
  readonly compass: boolean;
}

/**
 * A dungeon floor as the pause menu shows it: the rooms walked through (all of them with the map), where
 * Ask is, and with the compass the boss's lair and the chests still shut. Null when the dungeon has no
 * floor in the layout. Reads the save without touching it.
 */
export function dungeonMap(
  layout: WorldLayout,
  screens: Readonly<Record<ScreenId, ScreenDef>>,
  enemies: Readonly<Record<EnemyId, EnemyDef>>,
  state: GameState,
  dungeon: DungeonId,
  current: ScreenId,
): DungeonMapModel | null {
  const grid = layout.dungeons?.[dungeon];
  if (grid === undefined) return null;
  const d = peekDungeon(state, dungeon);
  const cells: DungeonCell[] = [];
  for (const [id, pos] of Object.entries(grid.at) as [ScreenId, readonly [number, number] | undefined][]) {
    if (pos === undefined) continue;
    const things = screens[id].things;
    const visited = state.world.visited.includes(id);
    cells.push({
      gx: pos[0],
      gy: pos[1],
      id,
      visited,
      shown: visited || d.map,
      here: id === current,
      boss:
        d.compass && !d.bossDead && things.some((t) => t.k === 'enemy' && enemies[t.id].boss !== undefined),
      chest: d.compass && things.some((t) => t.k === 'chest' && !state.world.opened.includes(t.id)),
    });
  }
  cells.sort((a, b) => a.gy - b.gy || a.gx - b.gx);
  return {
    dungeon,
    cols: grid.cols,
    rows: grid.rows,
    cells,
    keys: d.keys,
    bigKey: d.bigKey,
    map: d.map,
    compass: d.compass,
  };
}
