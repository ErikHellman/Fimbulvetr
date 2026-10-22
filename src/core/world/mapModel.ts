import type { FlagId } from '@content/flags';
import type { DungeonId, EnemyId, NpcId, RegionId } from '@content/ids';
import type { L10n } from '../i18n/t';
import type { ScreenId } from '@content/world/screens';
import type { EnemyDef } from '../actors/enemies/defs';
import type { NpcDef } from '../actors/npc';
import { DIR_VEC, type Dir4 } from '../math/dir';
import { evalCond, type CondCtx } from '../story/cond';
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
  /** A verse held points at a secret here, not yet found (drawn even if unvisited). */
  readonly marked: boolean;
}

export interface MapModel {
  readonly cells: readonly MapCell[];
  /** The grid rectangle worth drawing: every visited or marked cell plus the hero's (inclusive). */
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

/** A skald's verse: held under `flag`, it marks `screen` on the map until heart piece `piece` is found. */
export interface VerseDef {
  readonly flag: FlagId;
  readonly screen: ScreenId;
  readonly piece: string;
  /** The verse as sung, and kept in mind. */
  readonly text: L10n;
}

/** The screens the verses held still point at: the verse bought, its piece not yet taken. */
export function verseMarks(verses: readonly VerseDef[], state: GameState): ScreenId[] {
  return verses
    .filter((v) => state.flags[v.flag] === true && !state.world.pieces.includes(v.piece))
    .map((v) => v.screen);
}

/**
 * The screens the beacon arm-ring marks (M9): each overworld screen with a heart piece still lying out on
 * it or in a house entered from it. Dungeon rooms are left to the compass.
 */
export function beaconMarks(
  layout: WorldLayout,
  screens: Readonly<Record<ScreenId, ScreenDef>>,
  state: GameState,
): ScreenId[] {
  const out = new Set<ScreenId>();
  for (const def of Object.values(screens)) {
    if (def.dungeon !== undefined) continue;
    if (!def.things.some((t) => t.k === 'piece' && !state.world.pieces.includes(t.id))) continue;
    const grid = gridScreenOf(layout, screens, def.id);
    if (grid !== null) out.add(grid);
  }
  return [...out];
}

/**
 * The overworld as the pause menu shows it: every grid screen, which were visited, where the hero is, and
 * the screens `marks` points at (the skald's verses).
 */
export function overworldMap(
  layout: WorldLayout,
  screens: Readonly<Record<ScreenId, ScreenDef>>,
  visited: readonly ScreenId[],
  current: ScreenId,
  marks: readonly ScreenId[] = [],
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
      marked: marks.includes(id),
    });
  }
  cells.sort((a, b) => a.gy - b.gy || a.gx - b.gx);
  const shown = cells.filter((c) => c.visited || c.here || c.marked);
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

/** Grid screens by screen, per screen table: `gridScreenOf` walks every door, so it is worked out once. */
const gridCache = new WeakMap<object, Map<ScreenId, ScreenId | null>>();

function cachedGridScreen(
  layout: WorldLayout,
  screens: Readonly<Record<ScreenId, ScreenDef>>,
  id: ScreenId,
): ScreenId | null {
  let cache = gridCache.get(screens);
  if (cache === undefined) {
    cache = new Map();
    gridCache.set(screens, cache);
  }
  let grid = cache.get(id);
  if (grid === undefined) {
    grid = gridScreenOf(layout, screens, id);
    cache.set(id, grid);
  }
  return grid;
}

/**
 * Who is where on the overworld right now: each NPC under the grid screen its current place is on (or the
 * screen whose door leads to the house it is in), in registry order. NPCs in dungeons or nowhere are left out.
 */
export function npcsByCell(
  layout: WorldLayout,
  screens: Readonly<Record<ScreenId, ScreenDef>>,
  npcs: Readonly<Partial<Record<NpcId, NpcDef>>>,
  ctx: CondCtx,
): Map<ScreenId, NpcId[]> {
  const out = new Map<ScreenId, NpcId[]>();
  for (const def of Object.values(npcs)) {
    const place = def.places.find((p) => evalCond(p.when, ctx));
    if (place === undefined || screens[place.screen].dungeon !== undefined) continue;
    const grid = cachedGridScreen(layout, screens, place.screen);
    if (grid === null) continue;
    out.set(grid, [...(out.get(grid) ?? []), def.id]);
  }
  return out;
}

/**
 * Moving the map's look-around frame one step `dir` from `from`: to the nearest screen seen (visited or the
 * hero's) that way, favouring ones straight ahead. Stays put when nothing seen lies that way.
 */
export function lookStep(m: MapModel, from: ScreenId, dir: Dir4): ScreenId {
  const start = m.cells.find((c) => c.id === from);
  if (start === undefined) return from;
  const v = DIR_VEC[dir];
  let best: { id: ScreenId; score: number; side: number } | null = null;
  for (const c of m.cells) {
    if (!c.visited && !c.here) continue;
    const dx = c.gx - start.gx;
    const dy = c.gy - start.gy;
    const ahead = dx * v.x + dy * v.y;
    if (ahead <= 0) continue;
    const side = Math.abs(dx * v.y - dy * v.x);
    const score = ahead + 2 * side;
    if (best === null || score < best.score || (score === best.score && side < best.side))
      best = { id: c.id, score, side };
  }
  return best?.id ?? from;
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
