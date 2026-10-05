import type { FlagId } from '@content/flags';
import type { DungeonId, ItemId, ScriptId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import type { Season } from '../clock/types';
import { DIR_VEC, type Dir4 } from '../math/dir';
import type { ContentDb } from '../sim/db';
import { owns } from '../items/defs';
import { dungeonOf } from '../state/dungeons';
import type { GameState } from '../state/gameState';
import { cloneState } from '../state/save';
import { evalCond, type CondCtx } from '../story/cond';
import { buildCover, coverAt } from '../world/cover';
import { riseFooting } from '../world/water';
import { SCREEN_COLS, SCREEN_ROWS, TILE } from '../world/dims';
import { indexLayout, neighbourOf, type LayoutIndex, type RoomSignal, type Thing } from '../world/screen';
import { parseTextMap, type TerrainGrid } from '../world/textmap';

/**
 * Progression solver v1: floods the world tile by tile from the hero's position under the fixtures of the
 * current state, takes everything it can reach (chests, pieces, hearts, bosses, saved shutters, scripts),
 * floods again, and so on until nothing changes. Small keys are the only real choice, so it branches on
 * which reachable lock a key opens and explores every order. Root blocks and vines never block (pushing and
 * cutting are always possible), nor do props Ask can lift; brambles block until Eldr is known. A `use`
 * whose script warps (knocking at a barred gate) leads from beside it to where the warp puts Ask; one whose
 * script sets flags, teaches a galdr or gives what Ask lacks does so once it is reached. Enemies
 * other than bosses are assumed beaten with the sword.
 *
 * Given a season, the ground cover that season grows by itself counts too: winter ice makes still water
 * walkable, and a spring flood makes a shoal impassable. Without one, cover is ignored. Once Ís can be
 * sung (the galdr or a stave), still water off a screen's outer ring is walkable in any season. Hidden
 * floor (the ghost floor, the drowned path) is floor, as it is to the sim: light only shows it. Once the
 * grapple chain is held, a post in a straight line from a reached tile pulls Ask to the tile before it.
 * With the seal-skin, deep water (currents and surges too: a dive passes under a surge) is swum, and a
 * sunk chest or piece is dived for once its own tile is reached.
 */

export interface SolveOptions {
  /** Solve in this season, with the ice and floods it brings. */
  readonly season?: Season;
  /** Only these screens (a dungeon's rooms and its door): ways out of them lead nowhere. */
  readonly within?: readonly ScreenId[];
  /**
   * Search water levels too: Ask may turn any mill wheel they can strike (beside it, or by boomerang) when
   * the footing under them stays the same, so the reach is a (tile × level) graph. Without it, screens with
   * water are left out altogether (a dungeon of them is a dead end off the overworld), so whole-world
   * solves cost what they did; a dungeon's own proofs pass `within` and `levels`.
   */
  readonly levels?: boolean;
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
/** How far the grapple chain reaches a post, in tiles (it flies 96 px). */
const GRAPPLE_TILES = 6;
/** How far an arrow carries to an eye switch, in tiles (it flies 72 ticks at 5 px a tick). */
const ARROW_TILES = 12;
/** How far a Vindr gust carries to a wind fan or a sail, in tiles. */
const GUST_TILES = 5;
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

  /** Tile numbers span this many per level (every screen's 1024 cells). */
  readonly span: number;
  /** The water level flag the search turns wheels on, when searching levels (null otherwise). */
  readonly water: FlagId | null;

  constructor(
    readonly db: ContentDb,
    season?: Season,
    within?: readonly ScreenId[],
    levels = false,
  ) {
    const all = within ?? (Object.keys(db.screens) as ScreenId[]);
    this.ids = levels ? all : all.filter((id) => db.screens[id].water === undefined);
    this.ids.forEach((id, i) => this.idx.set(id, i));
    this.grids = this.ids.map((id) => parseTextMap(db.screens[id].map, db.legend));
    this.layout = indexLayout(db.layout, this.ids);
    this.passage = this.ids.map((id) => (season === undefined ? new Map() : coverPassage(db, id, season)));
    this.span = this.ids.length * 1024;
    const flags = new Set(this.ids.flatMap((id) => db.screens[id].water ?? []));
    if (levels && flags.size > 1) throw new Error('solver: one water level flag at a time');
    this.water = levels ? ([...flags][0] ?? null) : null;
  }

  has(id: ScreenId): boolean {
    return this.idx.has(id);
  }

  tile(id: ScreenId, x: number, y: number): number {
    return (this.idx.get(id) ?? 0) * 1024 + y * SCREEN_COLS + x;
  }

  where(t: number): { id: ScreenId; x: number; y: number } {
    const i = Math.floor(t / 1024);
    const r = t % 1024;
    return { id: this.ids[i] ?? this.ids[0] ?? 'test_a', x: r % SCREEN_COLS, y: Math.floor(r / SCREEN_COLS) };
  }

  /** The terrain's footing at water level `level` (which only matters on screens with water). */
  terrain(
    id: ScreenId,
    x: number,
    y: number,
    level = 0,
  ): { solid: boolean; low: boolean; ledge?: Dir4 } | null {
    if (x < 0 || y < 0 || x >= SCREEN_COLS || y >= SCREEN_ROWS) return null;
    const g = this.grids[this.idx.get(id) ?? 0];
    const cell = g?.cells[y * SCREEN_COLS + x];
    if (cell === undefined) return null;
    const def = this.db.terrain[cell];
    const cover = this.passage[this.idx.get(id) ?? 0]?.get(y * SCREEN_COLS + x);
    if (cover !== undefined) return { solid: !cover, low: !cover };
    if (def.rise !== undefined && this.db.screens[id].water !== undefined) {
      const footing = riseFooting(def.rise, level);
      return { solid: !footing, low: !footing };
    }
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
  /** Reachable tiles, whatever the water level. */
  reach: Set<number>;
  /** Reachable (tile, level) pairs when searching levels (`tile + level × span`); else the tiles again. */
  states: Set<number>;
  scripts: Set<ScriptId>;
}

export function solve(
  db: ContentDb,
  start: GameState,
  goal: (s: GameState) => boolean,
  opts: SolveOptions = {},
): SolveResult {
  const w = new World(db, opts.season, opts.within, opts.levels);
  if (!w.has(start.hero.screen)) throw new Error(`solver: ${start.hero.screen} is not searched (levels?)`);
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
  const node: Node = { state, reach: new Set(), states: new Set(), scripts: new Set() };
  for (let guard = 0; guard < 200; guard++) {
    node.states = flood(w, state, origin);
    node.reach = w.water === null ? node.states : new Set([...node.states].map((st) => st % w.span));
    if (!gather(w, node)) return node;
  }
  throw new Error('solver: settling did not converge');
}

/** What things do to the ground in a state: tiles they block, and tiles they give footing on. */
interface Ground {
  /** Gates, locks, shutters, chests, switches, braziers left shut or standing. */
  readonly blocked: ReadonlySet<number>;
  /** Lowered drawbridges, rafts' decks at their stops, and still water once Ís can floor it. */
  readonly open: ReadonlySet<number>;
  /** The seal-skin is held: dive doors can be taken (walking on Ís over one never does). */
  readonly dives: boolean;
}

function groundOf(w: World, state: GameState, reach: ReadonlySet<number> | null): Ground {
  return {
    blocked: blockedTiles(w, state, reach),
    open: bridgeTiles(w, state),
    dives: has(state, 'sealskin'),
  };
}

/**
 * Tiles of drawbridges that are down, and every tile of still water (outside screens with a water level)
 * once Ask can sing Ís, from the galdr or a stave: the frost lays a floor tile by tile, as far as needed.
 * Lava takes a crust the same way (M8): it cools only once Ask has stepped off it.
 */
function bridgeTiles(w: World, state: GameState): Set<number> {
  const out = new Set<number>();
  if (state.inv.galdr.includes('is') || has(state, 'stave_is'))
    for (const id of w.ids) {
      if (w.db.screens[id].water !== undefined) continue;
      const g = w.grids[w.idx.get(id) ?? 0];
      g?.cells.forEach((cell, i) => {
        const x = i % SCREEN_COLS;
        const y = Math.floor(i / SCREEN_COLS);
        // Ís never ices a screen's outer ring (see `freezeAround`); it crusts lava as it ices water.
        if ((cell === 'water' || w.db.terrain[cell].lava === true) && x > 0 && y > 0 && x < SCREEN_COLS - 1 && y < SCREEN_ROWS - 1)
          out.add(w.tile(id, x, y));
      });
    }
  // With the seal-skin, deep water is swum (a surge is crossed by diving under it).
  if (has(state, 'sealskin'))
    for (const id of w.ids) {
      const g = w.grids[w.idx.get(id) ?? 0];
      g?.cells.forEach((cell, i) => {
        if (w.db.terrain[cell].swim === true)
          out.add(w.tile(id, i % SCREEN_COLS, Math.floor(i / SCREEN_COLS)));
      });
    }
  const ctx = ctxOf(w, state);
  for (const id of w.ids)
    for (const t of w.db.screens[id].things) {
      if (t.k === 'raft')
        for (const stop of [t.at, ...t.path]) for (const i of deckOf(w, id, stop)) out.add(i);
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
      return t.sunk !== true;
    case 'switch':
    case 'wheel':
    case 'warp':
    case 'seal':
    case 'post':
    case 'brazier':
      return true;
    case 'lock':
      return !doors().includes(t.id);
    case 'crack':
      return !state.world.opened.includes(t.id);
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
      if (warp?.k !== 'warp' || !w.has(warp.screen)) continue;
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

/**
 * Once the grapple is held: from each tile in a straight four-way line of up to `GRAPPLE_TILES` from a post,
 * over floor or anything low (water, pits) and nothing left shut, to the tile before the post, when Ask can
 * stand there. One way only: the chain pulls, it never carries Ask back.
 */
function grappleEdges(w: World, state: GameState): Map<number, number[]> {
  const out = new Map<number, number[]>();
  if (!has(state, 'grapple')) return out;
  const blocked = blockedTiles(w, state, null);
  for (const id of w.ids)
    for (const t of w.db.screens[id].things) {
      if (t.k !== 'post') continue;
      for (const dir of ['n', 's', 'e', 'w'] as const) {
        const d = DIR_VEC[dir];
        const lx = t.at.x - d.x;
        const ly = t.at.y - d.y;
        const land = w.terrain(id, lx, ly);
        const to = w.tile(id, lx, ly);
        if (land === null || land.solid || blocked.has(to)) continue;
        for (let k = 2; k <= GRAPPLE_TILES; k++) {
          const fx = t.at.x - d.x * k;
          const fy = t.at.y - d.y * k;
          const between = w.terrain(id, fx + d.x, fy + d.y);
          if (between === null || (between.solid && !between.low)) break;
          if (k > 2 && blocked.has(w.tile(id, fx + d.x, fy + d.y))) break;
          const from = w.terrain(id, fx, fy);
          if (from === null) break;
          const f = w.tile(id, fx, fy);
          out.set(f, [...(out.get(f) ?? []), to]);
        }
      }
    }
  return out;
}

/** The four tiles of a raft's deck resting with its top-left tile at `at`. */
const deckOf = (w: World, id: ScreenId, at: { x: number; y: number }): number[] => [
  w.tile(id, at.x, at.y),
  w.tile(id, at.x + 1, at.y),
  w.tile(id, at.x, at.y + 1),
  w.tile(id, at.x + 1, at.y + 1),
];

/** A raft carries Ask from each stop's deck to the next stop's and back (its decks are footing); a sailing one needs Vindr. */
function raftEdges(w: World, state: GameState): Map<number, number[]> {
  const out = new Map<number, number[]>();
  // A sailing raft only leaves a stop when a gust fills its sail (Ask aboard sings it).
  const vindr = state.inv.galdr.includes('vindr');
  for (const id of w.ids)
    for (const t of w.db.screens[id].things) {
      if (t.k !== 'raft' || (t.sail === true && !vindr)) continue;
      const stops = [t.at, ...t.path];
      for (let i = 1; i < stops.length; i++) {
        const a = stops[i - 1];
        const b = stops[i];
        if (a === undefined || b === undefined) continue;
        const [ta] = deckOf(w, id, a);
        const [tb] = deckOf(w, id, b);
        if (ta === undefined || tb === undefined) continue;
        for (const f of deckOf(w, id, a)) out.set(f, [...(out.get(f) ?? []), tb]);
        for (const f of deckOf(w, id, b)) out.set(f, [...(out.get(f) ?? []), ta]);
      }
    }
  return out;
}

/** Every move that is not a step: warps from a `use`, pulls along the grapple chain, and raft rides. */
function jumpEdges(w: World, state: GameState): Map<number, number[]> {
  const out = warpEdges(w, state);
  for (const more of [grappleEdges(w, state), raftEdges(w, state)])
    for (const [from, to] of more) out.set(from, [...(out.get(from) ?? []), ...to]);
  return out;
}

/** The water level a state stands at (the flag of the screens with water; 0 without). */
function levelOf(w: World, state: GameState): number {
  const flag = w.water ?? w.ids.map((id) => w.db.screens[id].water).find((f) => f !== undefined);
  const v = flag === undefined ? undefined : state.flags[flag];
  return typeof v === 'number' ? v : 0;
}

/** Where one move from state `s` can lead: steps, warps and, when searching levels, turning a wheel. */
function moves(
  w: World,
  s: number,
  ground: Ground,
  warps: ReadonlyMap<number, number[]>,
  spots: ReadonlyMap<number, readonly number[]>,
  fixed: number,
): number[] {
  if (w.water === null) return [...steps(w, s, ground, fixed), ...(warps.get(s) ?? [])];
  const t = s % w.span;
  const level = Math.floor(s / w.span);
  const out = [...steps(w, t, ground, level), ...(warps.get(t) ?? [])].map((n) => n + level * w.span);
  for (const to of spots.get(t) ?? [])
    if (to !== level && sameFooting(w, t, level, to)) out.push(t + to * w.span);
  return out;
}

/** Whether the footing of tile `t` is the same at two water levels (a wheel refuses otherwise). */
function sameFooting(w: World, t: number, a: number, b: number): boolean {
  const { id, x, y } = w.where(t);
  return w.terrain(id, x, y, a)?.solid === w.terrain(id, x, y, b)?.solid;
}

/** Tiles from which a mill wheel can be struck (beside it, or by boomerang), mapped to the levels they set. */
function wheelSpots(w: World, state: GameState): Map<number, number[]> {
  const out = new Map<number, number[]>();
  if (w.water === null) return out;
  const blocked = blockedTiles(w, state, null);
  const add = (t: number, level: number): void => {
    out.set(t, [...(out.get(t) ?? []), level]);
  };
  for (const id of w.ids)
    for (const t of w.db.screens[id].things) {
      if (t.k !== 'wheel') continue;
      for (const [dx, dy] of DIRS8) {
        const reachOf = has(state, 'boomerang') ? FETCH_TILES : dx !== 0 && dy !== 0 ? 0 : 1;
        for (let k = 1; k <= reachOf; k++) {
          const fx = t.at.x + dx * k;
          const fy = t.at.y + dy * k;
          const tr = w.terrain(id, fx, fy);
          if (tr === null || (tr.solid && !tr.low) || blocked.has(w.tile(id, fx, fy))) break;
          add(w.tile(id, fx, fy), t.level);
        }
      }
    }
  return out;
}

/**
 * Every tile the hero can walk to from `origin`: 4-way steps, screen edges, doors and ledge hops; when
 * searching levels, every (tile, level) pair, starting at the state's level.
 */
function flood(w: World, state: GameState, origin: number): Set<number> {
  let reach = new Set<number>();
  const warps = jumpEdges(w, state);
  const spots = wheelSpots(w, state);
  const fixed = levelOf(w, state);
  const start = w.water === null ? origin : origin + fixed * w.span;
  // Shutters open on signals that depend on what is reachable, so flood until the set stops growing.
  for (let i = 0; i < 20; i++) {
    const tiles = w.water === null ? reach : new Set([...reach].map((s) => s % w.span));
    const ground = groundOf(w, state, tiles);
    const next = new Set<number>([start]);
    const queue = [start];
    while (queue.length > 0) {
      const t = queue.pop() ?? start;
      for (const n of moves(w, t, ground, warps, spots, fixed)) {
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

function walkable(w: World, ground: Ground, id: ScreenId, x: number, y: number, level: number): boolean {
  const tr = w.terrain(id, x, y, level);
  if (tr === null) return false;
  const tile = w.tile(id, x, y);
  return (!tr.solid || ground.open.has(tile)) && !ground.blocked.has(tile);
}

/** Where one step from tile `t` can lead, at water level `level`. */
function steps(w: World, t: number, ground: Ground, level: number): number[] {
  const { id, x, y } = w.where(t);
  const out: number[] = [];
  for (const dir of ['n', 's', 'e', 'w'] as const) {
    const d = DIR_VEC[dir];
    const nx = x + d.x;
    const ny = y + d.y;
    if (nx < 0 || ny < 0 || nx >= SCREEN_COLS || ny >= SCREEN_ROWS) {
      const to = neighbourOf(w.layout, id, dir);
      if (to === null || !w.has(to)) continue;
      const ex = (nx + SCREEN_COLS) % SCREEN_COLS;
      const ey = (ny + SCREEN_ROWS) % SCREEN_ROWS;
      if (walkable(w, ground, to, ex, ey, level)) out.push(w.tile(to, ex, ey));
      continue;
    }
    if (walkable(w, ground, id, nx, ny, level)) {
      out.push(w.tile(id, nx, ny));
      continue;
    }
    // A ledge facing this way is hopped: land on the far side.
    if (w.terrain(id, nx, ny)?.ledge === dir && walkable(w, ground, id, nx + d.x, ny + d.y, level))
      out.push(w.tile(id, nx + d.x, ny + d.y));
  }
  for (const thing of w.db.screens[id].things)
    if (
      thing.k === 'door' &&
      thing.at.x === x &&
      thing.at.y === y &&
      w.has(thing.to) &&
      (thing.dive !== true || ground.dives)
    )
      out.push(w.tile(thing.to, thing.arrive.x, thing.arrive.y));
  return out;
}

const has = (state: GameState, item: ItemId): boolean => (state.inv.items[item] ?? 0) > 0;

/**
 * A reachable tile orthogonally next to (x, y) on the same screen: close enough to open, strike or light
 * it. Off-screen neighbours never count (a tile number off the left edge would wrap to the row above).
 */
function besideReach(w: World, reach: ReadonlySet<number>, id: ScreenId, x: number, y: number): boolean {
  return [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ].some(([dx = 0, dy = 0]) => {
    const nx = x + dx;
    const ny = y + dy;
    return nx >= 0 && ny >= 0 && nx < SCREEN_COLS && ny < SCREEN_ROWS && reach.has(w.tile(id, nx, ny));
  });
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
      const tr = w.terrain(id, fx, fy);
      if (tr !== null && reach.has(w.tile(id, fx, fy))) return true;
      if (tr === null || (tr.solid && !tr.low) || blocked.has(w.tile(id, fx, fy))) break;
    }
  return false;
}

/**
 * Whether an arrow can reach tile (x, y) from somewhere reachable on its screen: once the bow is owned
 * (arrows, from pots and foes, never run out for good), along a straight four-way line over floor or low
 * ground (water, pits).
 */
function shootable(
  w: World,
  state: GameState,
  reach: ReadonlySet<number>,
  id: ScreenId,
  x: number,
  y: number,
): boolean {
  if (!has(state, 'bow')) return false;
  return inLine(w, state, reach, id, x, y, ARROW_TILES);
}

/** Whether a wind fan can be spun from the reach: Vindr known, a straight lane of up to five tiles. */
function gustable(
  w: World,
  state: GameState,
  reach: ReadonlySet<number>,
  id: ScreenId,
  x: number,
  y: number,
): boolean {
  if (!state.inv.galdr.includes('vindr')) return false;
  return inLine(w, state, reach, id, x, y, GUST_TILES);
}

/** Whether a reached tile lies up to `tiles` off (x, y) in a straight line over nothing that stops a shot. */
function inLine(
  w: World,
  state: GameState,
  reach: ReadonlySet<number>,
  id: ScreenId,
  x: number,
  y: number,
  tiles: number,
): boolean {
  const blocked = blockedTiles(w, state, null);
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const)
    for (let k = 1; k <= tiles; k++) {
      const fx = x - dx * k;
      const fy = y - dy * k;
      const tr = w.terrain(id, fx, fy);
      if (tr !== null && reach.has(w.tile(id, fx, fy))) return true;
      if (tr === null || (tr.solid && !tr.low) || blocked.has(w.tile(id, fx, fy))) break;
    }
  return false;
}

/** Whether a switch can be struck from the reach: a fan only by a gust, an eye only by an arrow, a plain one any way. */
function strikable(
  w: World,
  state: GameState,
  reach: ReadonlySet<number>,
  id: ScreenId,
  t: Extract<Thing, { k: 'switch' }>,
): boolean {
  const { x, y } = t.at;
  if (t.fan === true) return gustable(w, state, reach, id, x, y);
  if (shootable(w, state, reach, id, x, y)) return true;
  if (t.eye === true) return false;
  return besideReach(w, reach, id, x, y) || throwable(w, state, reach, id, x, y);
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
  return def.things.some((t) => {
    const boss = t.k === 'enemy' ? w.db.enemies[t.id].boss : undefined;
    return t.k === 'enemy' && boss !== undefined && boss.mini !== true && evalCond(t.when, ctx);
  });
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
    case 'clear': {
      // Foes are beaten with the sword, except those that need more (a mud-crab's shell needs bombs).
      const ctx = ctxOf(w, state);
      return (
        !bossAlive(w, state, id) &&
        things.every(
          (t) =>
            t.k !== 'enemy' ||
            !evalCond(t.when, ctx) ||
            (w.db.enemies[t.id].needs ?? []).every((item) => owns(state.inv.items, item)),
        )
      );
    }
    case 'blocks':
      return true;
    case 'switches':
      return things.every((t) => t.k !== 'switch' || strikable(w, state, reach, id, t));
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
          // A sunk chest is dived for: Ask swims onto its tile.
          if (
            t.sunk === true
              ? !divable(w, state, reach, id, t.at.x, t.at.y)
              : !besideReach(w, reach, id, t.at.x, t.at.y)
          )
            return;
          state.world.opened.push(t.id);
          if ('item' in t.gives) give(w, state, id, t.gives.item, t.gives.n ?? 1);
          if (t.learn !== undefined && !state.inv.galdr.includes(t.learn)) state.inv.galdr.push(t.learn);
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
          if (t.k === 'piece' && t.sunk === true) {
            if (!divable(w, state, reach, id, t.at.x, t.at.y)) return;
          } else if (
            !reach.has(w.tile(id, t.at.x, t.at.y)) &&
            !throwable(w, state, reach, id, t.at.x, t.at.y)
          )
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
          if (
            e.boss === undefined ||
            e.boss.mini === true ||
            !evalCond(t.when, ctx) ||
            !bossAlive(w, state, id)
          )
            return;
          if (!(e.needs ?? []).every((item) => has(state, item))) return;
          for (const eff of t.onDeath ?? []) if (eff.k === 'set') state.flags[eff.flag] = eff.value;
          if (def.dungeon !== undefined) dungeonOf(state, def.dungeon).bossDead = true;
          changed = true;
          return;
        }
        case 'switch': {
          // A latch: struck from beside it, or by the boomerang from across the water, it sets its flag.
          if (t.set === undefined || state.flags[t.set] === true) return;
          if (!strikable(w, state, reach, id, t)) return;
          state.flags[t.set] = true;
          changed = true;
          return;
        }
        case 'lock': {
          // The big key is never spent, so a big lock is no choice: it opens as soon as Ask reaches it.
          if (t.big !== true || def.dungeon === undefined) return;
          const d = dungeonOf(state, def.dungeon);
          if (!d.bigKey || d.doors.includes(t.id)) return;
          let near = false;
          for (let dy = 0; dy < t.h && !near; dy++)
            for (let dx = 0; dx < t.w && !near; dx++)
              near = besideReach(w, reach, id, t.at.x + dx, t.at.y + dy);
          if (!near) return;
          d.doors.push(t.id);
          changed = true;
          return;
        }
        case 'gate': {
          // Ice that fire melts (the rime), or a web that wind tears: Eldr or Vindr, once known, from beside it.
          const flag = t.melts ?? t.blows;
          const song = t.melts !== undefined ? 'eldr' : 'vindr';
          if (flag === undefined || state.flags[flag] === true) return;
          if (!state.inv.galdr.includes(song) || !evalCond(t.closed, ctx)) return;
          let near = false;
          for (let dy = 0; dy < t.h && !near; dy++)
            for (let dx = 0; dx < t.w && !near; dx++)
              near = besideReach(w, reach, id, t.at.x + dx, t.at.y + dy);
          if (!near) return;
          state.flags[flag] = true;
          changed = true;
          return;
        }
        case 'crack': {
          // Bombs, once owned, are never used up: every crack beside the reach can be blown open.
          if (state.world.opened.includes(t.id) || !owns(state.inv.items, 'bombs')) return;
          let near = false;
          for (let dy = 0; dy < t.h && !near; dy++)
            for (let dx = 0; dx < t.w && !near; dx++)
              near = besideReach(w, reach, id, t.at.x + dx, t.at.y + dy);
          if (!near) return;
          state.world.opened.push(t.id);
          changed = true;
          return;
        }
        case 'use': {
          if (!evalCond(t.when, ctx)) return;
          // A wide use (a table, a boat) is used from beside any of its tiles.
          let near = false;
          for (let dy = 0; dy < (t.h ?? 1) && !near; dy++)
            for (let dx = 0; dx < (t.w ?? 1) && !near; dx++)
              near = besideReach(w, reach, id, t.at.x + dx, t.at.y + dy);
          if (!near) return;
          node.scripts.add(t.script);
          // What the script does for good: flags set, galdr taught, and things given that Ask lacks (so a
          // stave rack that refills an empty hand counts once, not over and over).
          for (const step of w.db.scripts[t.script]?.steps ?? [])
            if (step.k === 'do')
              for (const eff of step.effects)
                if (eff.k === 'set' && state.flags[eff.flag] !== eff.value) {
                  state.flags[eff.flag] = eff.value;
                  changed = true;
                } else if (eff.k === 'learn' && !state.inv.galdr.includes(eff.galdr)) {
                  state.inv.galdr.push(eff.galdr);
                  changed = true;
                } else if (eff.k === 'give' && !has(state, eff.item)) {
                  give(w, state, id, eff.item, eff.n ?? 1);
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

/**
 * A sunk thing's tile is reached as open water by a seal-skin owner: the season's ice over it is ground to
 * walk on, and no one dives through it.
 */
function divable(
  w: World,
  state: GameState,
  reach: ReadonlySet<number>,
  id: ScreenId,
  x: number,
  y: number,
): boolean {
  if (!has(state, 'sealskin') || !reach.has(w.tile(id, x, y))) return false;
  return w.passage[w.idx.get(id) ?? 0]?.get(y * SCREEN_COLS + x) !== true;
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
      if (t.k !== 'lock' || t.big === true || d.doors.includes(t.id) || seen.has(t.id)) continue;
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

/** Reachable tiles (at some water level) from which no path leads back to the starting tile. */
function strandedTiles(w: World, node: Node, origin: number): number[] {
  const ground = groundOf(w, node.state, node.reach);
  const warps = jumpEdges(w, node.state);
  const spots = wheelSpots(w, node.state);
  const fixed = levelOf(w, node.state);
  const back = new Map<number, number[]>();
  for (const s of node.states)
    for (const n of moves(w, s, ground, warps, spots, fixed)) {
      if (!node.states.has(n)) continue;
      const list = back.get(n);
      if (list === undefined) back.set(n, [s]);
      else list.push(s);
    }
  const tileOf = (s: number): number => (w.water === null ? s : s % w.span);
  const home = new Set<number>([...node.states].filter((s) => tileOf(s) === origin));
  const queue = [...home];
  while (queue.length > 0) {
    const s = queue.pop() ?? origin;
    for (const p of back.get(s) ?? []) {
      if (home.has(p)) continue;
      home.add(p);
      queue.push(p);
    }
  }
  return [...new Set([...node.states].filter((s) => !home.has(s)).map(tileOf))];
}
