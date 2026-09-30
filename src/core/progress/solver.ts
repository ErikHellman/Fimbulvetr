import type { DungeonId, ItemId, ScriptId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import type { Season } from '../clock/types';
import { DIR_VEC, type Dir4 } from '../math/dir';
import type { ContentDb } from '../sim/db';
import { dungeonOf } from '../state/dungeons';
import type { GameState } from '../state/gameState';
import { cloneState } from '../state/save';
import { evalCond, type CondCtx } from '../story/cond';
import { buildCover, coverAt } from '../world/cover';
import { SCREEN_COLS, SCREEN_ROWS, TILE } from '../world/dims';
import { indexLayout, neighbourOf, type LayoutIndex, type RoomSignal, type Thing } from '../world/screen';
import { parseTextMap, type TerrainGrid } from '../world/textmap';

/**
 * Progression solver v1: floods the world tile by tile from the hero's position under the fixtures of the
 * current state, takes everything it can reach (chests, pieces, hearts, bosses, saved shutters, scripts),
 * floods again, and so on until nothing changes. Small keys are the only real choice, so it branches on
 * which reachable lock a key opens and explores every order. Root blocks and vines never block (pushing and
 * cutting are always possible), nor do props Ask can lift; brambles block until Eldr is known. A `use`
 * whose script warps (knocking at a barred gate) leads from beside it to where the warp puts Ask. Enemies
 * other than bosses are assumed beaten with the sword.
 *
 * Given a season, the ground cover that season grows by itself counts too: winter ice makes still water
 * walkable, and a spring flood makes a shoal impassable. Without one, cover is ignored.
 */

export interface SolveOptions {
  /** Solve in this season, with the ice and floods it brings. */
  readonly season?: Season;
}

export interface SolveResult {
  /** The goal holds in at least one line of play. */
  readonly finishable: boolean;
  /** Chests and heart containers taken, and pieces collected, in any line of play. */
  readonly opened: readonly string[];
  readonly pieces: readonly string[];
  /** Scripts whose `use` things could be run. */
  readonly scripts: readonly ScriptId[];
  readonly screens: readonly ScreenId[];
  /** Distinct states explored (one per order of spending keys). */
  readonly branches: number;
  /** States from which the goal can no longer be reached, by the doors opened so far. */
  readonly softLocks: readonly string[];
  /** Reachable tiles from which the starting tile cannot be reached again. */
  readonly stranded: readonly string[];
}

const FETCH_TILES = 7;
const DIRS8: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

/**
 * The tiles of a screen whose footing the season's own cover changes: `true` where it makes them walkable
 * (ice over water), `false` where it makes them impassable (a flood over a shoal). Uses the sim's own cover
 * rules, so the solver and the game cannot disagree. Cuts and melted patches are not counted.
 */
export function coverPassage(db: ContentDb, id: ScreenId, season: Season): Map<number, boolean> {
  const def = db.screens[id];
  const terrain = parseTextMap(def.map, db.legend);
  const g = buildCover(
    def.map,
    db.coverLegend,
    db.coverOrder,
    db.cover,
    db.clock.fixedSeason[def.region] ?? season,
    0,
    undefined,
    { terrain, outdoor: def.indoor !== true && def.dungeon === undefined, wet: true },
  );
  const out = new Map<number, boolean>();
  for (let y = 0; y < g.rows; y++)
    for (let x = 0; x < g.cols; x++) {
      const kind = coverAt(g, db.coverOrder, x, y);
      if (kind === null) continue;
      const c = db.cover[kind];
      if (c.walk === true) out.set(y * g.cols + x, true);
      else if (c.sink === true) out.set(y * g.cols + x, false);
    }
  return out;
}

class World {
  readonly ids: readonly ScreenId[];
  readonly idx = new Map<ScreenId, number>();
  readonly grids: TerrainGrid[];
  readonly layout: LayoutIndex;
  /** Per screen, the season's cover over the terrain (see coverPassage); empty without a season. */
  readonly passage: ReadonlyMap<number, boolean>[];

  constructor(
    readonly db: ContentDb,
    season?: Season,
  ) {
    this.ids = Object.keys(db.screens) as ScreenId[];
    this.ids.forEach((id, i) => this.idx.set(id, i));
    this.grids = this.ids.map((id) => parseTextMap(db.screens[id].map, db.legend));
    this.layout = indexLayout(db.layout, this.ids);
    this.passage = this.ids.map((id) => (season === undefined ? new Map() : coverPassage(db, id, season)));
  }

  tile(id: ScreenId, x: number, y: number): number {
    return (this.idx.get(id) ?? 0) * 1024 + y * SCREEN_COLS + x;
  }

  where(t: number): { id: ScreenId; x: number; y: number } {
    const i = Math.floor(t / 1024);
    const r = t % 1024;
    return { id: this.ids[i] ?? this.ids[0] ?? 'test_a', x: r % SCREEN_COLS, y: Math.floor(r / SCREEN_COLS) };
  }

  terrain(id: ScreenId, x: number, y: number): { solid: boolean; low: boolean; ledge?: Dir4 } | null {
    if (x < 0 || y < 0 || x >= SCREEN_COLS || y >= SCREEN_ROWS) return null;
    const g = this.grids[this.idx.get(id) ?? 0];
    const cell = g?.cells[y * SCREEN_COLS + x];
    if (cell === undefined) return null;
    const def = this.db.terrain[cell];
    const cover = this.passage[this.idx.get(id) ?? 0]?.get(y * SCREEN_COLS + x);
    if (cover !== undefined) return { solid: !cover, low: !cover };
    return {
      solid: def.solid || def.ledge !== undefined,
      low: def.low === true,
      ...(def.ledge === undefined ? {} : { ledge: def.ledge }),
    };
  }
}

/** One line of play: the saved state it has reached and what it could do there. */
interface Node {
  readonly state: GameState;
  reach: Set<number>;
  scripts: Set<ScriptId>;
}

export function solve(
  db: ContentDb,
  start: GameState,
  goal: (s: GameState) => boolean,
  opts: SolveOptions = {},
): SolveResult {
  const w = new World(db, opts.season);
  const origin = w.tile(
    start.hero.screen,
    Math.floor(start.hero.x / TILE),
    Math.floor((start.hero.y - 1) / TILE),
  );
  const seen = new Map<string, boolean>();
  const opened = new Set<string>();
  const pieces = new Set<string>();
  const scripts = new Set<ScriptId>();
  const screens = new Set<ScreenId>();
  const softLocks: string[] = [];
  const stranded = new Set<string>();

  const explore = (state: GameState): boolean => {
    const node = settle(w, state, origin);
    const key = keyOf(node.state);
    const known = seen.get(key);
    if (known !== undefined) return known;
    seen.set(key, false);
    for (const id of node.state.world.opened) opened.add(id);
    for (const id of node.state.world.pieces) pieces.add(id);
    for (const s of node.scripts) scripts.add(s);
    for (const t of node.reach) screens.add(w.where(t).id);
    for (const t of strandedTiles(w, node, origin)) {
      const p = w.where(t);
      stranded.add(`${p.id} ${String(p.x)},${String(p.y)}`);
    }
    let ok = goal(node.state);
    for (const lock of openableLocks(w, node)) {
      const next = cloneState(node.state);
      const d = dungeonOf(next, lock.dungeon);
      d.keys -= 1;
      d.doors.push(lock.id);
      if (explore(next)) ok = true;
    }
    seen.set(key, ok);
    if (!ok) softLocks.push(doorsOf(node.state));
    return ok;
  };

  const first = cloneState(start);
  if (opts.season !== undefined) first.clock.season = opts.season;
  const finishable = explore(first);
  return {
    finishable,
    opened: [...opened].sort(),
    pieces: [...pieces].sort(),
    scripts: [...scripts].sort(),
    screens: [...screens].sort(),
    branches: seen.size,
    softLocks: finishable ? softLocks : [],
    stranded: [...stranded].sort(),
  };
}

const keyOf = (s: GameState): string =>
  JSON.stringify([s.flags, [...s.world.opened].sort(), [...s.world.pieces].sort(), s.dungeons, s.inv.items]);

const doorsOf = (s: GameState): string =>
  Object.entries(s.dungeons)
    .map(([id, d]) => `${id}: ${[...d.doors].sort().join(' ')}`)
    .join('; ');

const ctxOf = (w: World, state: GameState): CondCtx => ({ state, quests: w.db.quests });

/** Takes everything reachable, over and over, until nothing new comes of it. */
function settle(w: World, state: GameState, origin: number): Node {
  const node: Node = { state, reach: new Set(), scripts: new Set() };
  for (let guard = 0; guard < 200; guard++) {
    node.reach = flood(w, state, origin);
    if (!gather(w, node)) return node;
  }
  throw new Error('solver: settling did not converge');
}

/** What things do to the ground in a state: tiles they block, and tiles they give footing on. */
interface Ground {
  /** Gates, locks, shutters, chests, switches, braziers left shut or standing. */
  readonly blocked: ReadonlySet<number>;
  /** Lowered drawbridges. */
  readonly open: ReadonlySet<number>;
}

function groundOf(w: World, state: GameState, reach: ReadonlySet<number> | null): Ground {
  return { blocked: blockedTiles(w, state, reach), open: bridgeTiles(w, state) };
}

/** Tiles of drawbridges that are down. */
function bridgeTiles(w: World, state: GameState): Set<number> {
  const out = new Set<number>();
  const ctx = ctxOf(w, state);
  for (const id of w.ids)
    for (const t of w.db.screens[id].things) {
      if (t.k !== 'bridge' || !evalCond(t.down, ctx)) continue;
      for (let dy = 0; dy < t.h; dy++)
        for (let dx = 0; dx < t.w; dx++) out.add(w.tile(id, t.at.x + dx, t.at.y + dy));
    }
  return out;
}

/** Tiles blocked by things this state leaves shut: gates, locks, shutters, chests, switches, braziers. */
function blockedTiles(w: World, state: GameState, reach: ReadonlySet<number> | null): Set<number> {
  const out = new Set<number>();
  const ctx = ctxOf(w, state);
  for (const id of w.ids) {
    const def = w.db.screens[id];
    for (const t of def.things) {
      if (!solidThing(w, state, ctx, id, t, reach)) continue;
      const { x, y } = t.at;
      const tw = 'w' in t && typeof t.w === 'number' ? t.w : 1;
      const th = 'h' in t && typeof t.h === 'number' ? t.h : 1;
      for (let dy = 0; dy < th; dy++) for (let dx = 0; dx < tw; dx++) out.add(w.tile(id, x + dx, y + dy));
    }
  }
  return out;
}

function solidThing(
  w: World,
  state: GameState,
  ctx: CondCtx,
  id: ScreenId,
  t: Thing,
  reach: ReadonlySet<number> | null,
): boolean {
  const doors = (): string[] => {
    const d = w.db.screens[id].dungeon;
    return d === undefined ? [] : dungeonOf(state, d).doors;
  };
  switch (t.k) {
    case 'gate':
      return evalCond(t.closed, ctx);
    case 'chest':
    case 'switch':
    case 'brazier':
      return true;
    case 'lock':
      return !doors().includes(t.id);
    case 'shutter': {
      if (!evalCond(t.when, ctx)) return false;
      if (t.id !== undefined && doors().includes(t.id)) return false;
      // A trap (clear) is open as Ask comes in, and opens again once the room is beaten.
      if (t.opens === 'clear') return false;
      return !(t.opens !== undefined && reach !== null && signal(w, state, id, t.opens, reach));
    }
    case 'prop':
      // Only fire clears brambles; everything else is lifted, pushed or cut out of the way.
      return w.db.props[t.id].burns === true && !state.inv.galdr.includes('eldr') && evalCond(t.when, ctx);
    default:
      return false;
  }
}

/** Tiles beside a `use` whose script warps, mapped to where the warp puts Ask (knocking at a gate). */
function warpEdges(w: World, state: GameState): Map<number, number[]> {
  const out = new Map<number, number[]>();
  const ctx = ctxOf(w, state);
  for (const id of w.ids)
    for (const t of w.db.screens[id].things) {
      if (t.k !== 'use' || !evalCond(t.when, ctx)) continue;
      const warp = w.db.scripts[t.script]?.steps.find((step) => step.k === 'warp');
      if (warp?.k !== 'warp') continue;
      const to = w.tile(warp.screen, warp.at.x, warp.at.y);
      const tw = t.w ?? 1;
      const th = t.h ?? 1;
      for (let dy = -1; dy <= th; dy++)
        for (let dx = -1; dx <= tw; dx++) {
          const edge = (dx === -1 || dx === tw) !== (dy === -1 || dy === th);
          if (!edge) continue;
          const from = w.tile(id, t.at.x + dx, t.at.y + dy);
          out.set(from, [...(out.get(from) ?? []), to]);
        }
    }
  return out;
}

/** Every tile the hero can walk to from `origin`: 4-way steps, screen edges, doors and ledge hops. */
function flood(w: World, state: GameState, origin: number): Set<number> {
  let reach = new Set<number>();
  const warps = warpEdges(w, state);
  // Shutters open on signals that depend on what is reachable, so flood until the set stops growing.
  for (let i = 0; i < 20; i++) {
    const ground = groundOf(w, state, reach);
    const next = new Set<number>([origin]);
    const queue = [origin];
    while (queue.length > 0) {
      const t = queue.pop() ?? origin;
      for (const n of [...steps(w, t, ground), ...(warps.get(t) ?? [])]) {
        if (next.has(n)) continue;
        next.add(n);
        queue.push(n);
      }
    }
    if (next.size === reach.size) return next;
    reach = next;
  }
  return reach;
}

function walkable(w: World, ground: Ground, id: ScreenId, x: number, y: number): boolean {
  const tr = w.terrain(id, x, y);
  if (tr === null) return false;
  const tile = w.tile(id, x, y);
  return (!tr.solid || ground.open.has(tile)) && !ground.blocked.has(tile);
}

/** Where one step from tile `t` can lead. */
function steps(w: World, t: number, ground: Ground): number[] {
  const { id, x, y } = w.where(t);
  const out: number[] = [];
  for (const dir of ['n', 's', 'e', 'w'] as const) {
    const d = DIR_VEC[dir];
    const nx = x + d.x;
    const ny = y + d.y;
    if (nx < 0 || ny < 0 || nx >= SCREEN_COLS || ny >= SCREEN_ROWS) {
      const to = neighbourOf(w.layout, id, dir);
      if (to === null) continue;
      const ex = (nx + SCREEN_COLS) % SCREEN_COLS;
      const ey = (ny + SCREEN_ROWS) % SCREEN_ROWS;
      if (walkable(w, ground, to, ex, ey)) out.push(w.tile(to, ex, ey));
      continue;
    }
    if (walkable(w, ground, id, nx, ny)) {
      out.push(w.tile(id, nx, ny));
      continue;
    }
    // A ledge facing this way is hopped: land on the far side.
    if (w.terrain(id, nx, ny)?.ledge === dir && walkable(w, ground, id, nx + d.x, ny + d.y))
      out.push(w.tile(id, nx + d.x, ny + d.y));
  }
  for (const thing of w.db.screens[id].things)
    if (thing.k === 'door' && thing.at.x === x && thing.at.y === y)
      out.push(w.tile(thing.to, thing.arrive.x, thing.arrive.y));
  return out;
}

const has = (state: GameState, item: ItemId): boolean => (state.inv.items[item] ?? 0) > 0;

/** A reachable tile orthogonally next to (x, y): close enough to open, strike or light it. */
function besideReach(w: World, reach: ReadonlySet<number>, id: ScreenId, x: number, y: number): boolean {
  return [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ].some(([dx = 0, dy = 0]) => reach.has(w.tile(id, x + dx, y + dy)));
}

/** Whether the boomerang can reach tile (x, y) from somewhere reachable on its screen: over floor or low. */
function throwable(
  w: World,
  state: GameState,
  reach: ReadonlySet<number>,
  id: ScreenId,
  x: number,
  y: number,
): boolean {
  if (!has(state, 'boomerang')) return false;
  const blocked = blockedTiles(w, state, null);
  for (const [dx, dy] of DIRS8)
    for (let k = 1; k <= FETCH_TILES; k++) {
      const fx = x - dx * k;
      const fy = y - dy * k;
      if (reach.has(w.tile(id, fx, fy))) return true;
      const tr = w.terrain(id, fx, fy);
      if (tr === null || (tr.solid && !tr.low) || blocked.has(w.tile(id, fx, fy))) break;
    }
  return false;
}

function roomReached(w: World, reach: ReadonlySet<number>, id: ScreenId): boolean {
  const base = (w.idx.get(id) ?? 0) * 1024;
  for (let i = 0; i < SCREEN_COLS * SCREEN_ROWS; i++) if (reach.has(base + i)) return true;
  return false;
}

function bossAlive(w: World, state: GameState, id: ScreenId): boolean {
  const def = w.db.screens[id];
  const ctx = ctxOf(w, state);
  if (def.dungeon !== undefined && dungeonOf(state, def.dungeon).bossDead) return false;
  return def.things.some(
    (t) => t.k === 'enemy' && w.db.enemies[t.id].boss !== undefined && evalCond(t.when, ctx),
  );
}

function signal(
  w: World,
  state: GameState,
  id: ScreenId,
  s: RoomSignal,
  reach: ReadonlySet<number>,
): boolean {
  if (!roomReached(w, reach, id)) return false;
  const things = w.db.screens[id].things;
  switch (s) {
    case 'clear':
      return !bossAlive(w, state, id);
    case 'blocks':
      return true;
    case 'switches':
      return things.every(
        (t) =>
          t.k !== 'switch' ||
          besideReach(w, reach, id, t.at.x, t.at.y) ||
          throwable(w, state, reach, id, t.at.x, t.at.y),
      );
    case 'braziers':
      return things.every(
        (t) =>
          t.k !== 'brazier' ||
          t.lit === true ||
          (has(state, 'lantern') && besideReach(w, reach, id, t.at.x, t.at.y)),
      );
  }
}

/** Takes what the flooded tiles reach. Returns whether anything changed. */
function gather(w: World, node: Node): boolean {
  const { state, reach } = node;
  const ctx = ctxOf(w, state);
  let changed = false;
  for (const id of w.ids) {
    if (!roomReached(w, reach, id)) continue;
    const def = w.db.screens[id];
    def.things.forEach((t) => {
      switch (t.k) {
        case 'chest': {
          if (state.world.opened.includes(t.id) || !evalCond(t.when, ctx)) return;
          if (t.appear !== undefined && !signal(w, state, id, t.appear, reach)) return;
          if (!besideReach(w, reach, id, t.at.x, t.at.y)) return;
          state.world.opened.push(t.id);
          if ('item' in t.gives) give(w, state, id, t.gives.item, t.gives.n ?? 1);
          changed = true;
          return;
        }
        case 'heart':
        case 'piece': {
          const got = t.k === 'piece' ? state.world.pieces : state.world.opened;
          if (got.includes(t.id)) return;
          if (
            t.k === 'heart' &&
            (!evalCond(t.when, ctx) || (t.appear !== undefined && !signal(w, state, id, t.appear, reach)))
          )
            return;
          if (!reach.has(w.tile(id, t.at.x, t.at.y)) && !throwable(w, state, reach, id, t.at.x, t.at.y))
            return;
          got.push(t.id);
          changed = true;
          return;
        }
        case 'shutter': {
          if (
            t.id === undefined ||
            t.opens === undefined ||
            !evalCond(t.when, ctx) ||
            def.dungeon === undefined
          )
            return;
          const doors = dungeonOf(state, def.dungeon).doors;
          if (doors.includes(t.id) || !signal(w, state, id, t.opens, reach)) return;
          doors.push(t.id);
          changed = true;
          return;
        }
        case 'enemy': {
          const e = w.db.enemies[t.id];
          if (e.boss === undefined || !evalCond(t.when, ctx) || !bossAlive(w, state, id)) return;
          if (!(e.needs ?? []).every((item) => has(state, item))) return;
          for (const eff of t.onDeath ?? []) if (eff.k === 'set') state.flags[eff.flag] = eff.value;
          if (def.dungeon !== undefined) dungeonOf(state, def.dungeon).bossDead = true;
          changed = true;
          return;
        }
        case 'switch': {
          // A latch: struck from beside it, or by the boomerang from across the water, it sets its flag.
          if (t.set === undefined || state.flags[t.set] === true) return;
          if (!besideReach(w, reach, id, t.at.x, t.at.y) && !throwable(w, state, reach, id, t.at.x, t.at.y))
            return;
          state.flags[t.set] = true;
          changed = true;
          return;
        }
        case 'use': {
          if (!evalCond(t.when, ctx) || !besideReach(w, reach, id, t.at.x, t.at.y)) return;
          node.scripts.add(t.script);
          for (const step of w.db.scripts[t.script]?.steps ?? [])
            if (step.k === 'do')
              for (const eff of step.effects)
                if (eff.k === 'set' && state.flags[eff.flag] !== eff.value) {
                  state.flags[eff.flag] = eff.value;
                  changed = true;
                }
          return;
        }
        default:
          return;
      }
    });
  }
  return changed;
}

function give(w: World, state: GameState, id: ScreenId, item: ItemId, n: number): void {
  const def = w.db.items[item];
  const dungeon = w.db.screens[id].dungeon;
  if (def.dungeon !== undefined) {
    if (dungeon === undefined) return;
    const d = dungeonOf(state, dungeon);
    if (def.dungeon === 'key') d.keys += n;
    else d[def.dungeon] = true;
    return;
  }
  state.inv.items[item] = (state.inv.items[item] ?? 0) + n;
}

/** Locks next to reachable tiles that a key in hand could open now. */
function openableLocks(w: World, node: Node): { id: string; dungeon: DungeonId }[] {
  const out: { id: string; dungeon: DungeonId }[] = [];
  const seen = new Set<string>();
  for (const id of w.ids) {
    const dungeon = w.db.screens[id].dungeon;
    if (dungeon === undefined) continue;
    const d = dungeonOf(node.state, dungeon);
    if (d.keys < 1) continue;
    for (const t of w.db.screens[id].things) {
      if (t.k !== 'lock' || d.doors.includes(t.id) || seen.has(t.id)) continue;
      let near = false;
      for (let dy = 0; dy < t.h && !near; dy++)
        for (let dx = 0; dx < t.w && !near; dx++)
          near = besideReach(w, node.reach, id, t.at.x + dx, t.at.y + dy);
      if (!near) continue;
      seen.add(t.id);
      out.push({ id: t.id, dungeon });
    }
  }
  return out;
}

/** Reachable tiles from which no path leads back to the starting tile. */
function strandedTiles(w: World, node: Node, origin: number): number[] {
  const ground = groundOf(w, node.state, node.reach);
  const warps = warpEdges(w, node.state);
  const back = new Map<number, number[]>();
  for (const t of node.reach)
    for (const n of [...steps(w, t, ground), ...(warps.get(t) ?? [])]) {
      if (!node.reach.has(n)) continue;
      const list = back.get(n);
      if (list === undefined) back.set(n, [t]);
      else list.push(t);
    }
  const home = new Set<number>([origin]);
  const queue = [origin];
  while (queue.length > 0) {
    const t = queue.pop() ?? origin;
    for (const p of back.get(t) ?? []) {
      if (home.has(p)) continue;
      home.add(p);
      queue.push(p);
    }
  }
  return [...node.reach].filter((t) => !home.has(t));
}
