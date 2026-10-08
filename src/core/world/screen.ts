import type { FlagId } from '@content/flags';
import type {
  CritterId,
  DungeonId,
  EnemyId,
  GaldrId,
  ItemId,
  PropId,
  RegionId,
  ScriptId,
} from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import { DIR_VEC, type Dir4 } from '../math/dir';
import type { L10n } from '../i18n/t';
import type { Vec } from '../math/vec';
import type { Season } from '../clock/types';
import type { Cond } from '../story/cond';
import type { Effect } from '../story/effects';
import { SCREEN_H, SCREEN_W, TILE } from './dims';

export interface TilePos {
  readonly x: number;
  readonly y: number;
}

/** A doorway: walking into tile `at` while facing `dir` fades to screen `to`, arriving on `arrive`. */
export interface DoorThing {
  readonly k: 'door';
  readonly at: TilePos;
  readonly dir: Dir4;
  readonly to: ScreenId;
  readonly arrive: TilePos;
  readonly facing: Dir4;
  /** Under deep water (M7b, Sökkva Hof's spire): a ripple marks it, and only a dive over it goes through. */
  readonly dive?: true;
}

/**
 * A room-wide condition, worked out from the live actors each tick: `clear` once no mortal enemy is left,
 * `switches` once every switch is lit, `braziers` once every brazier burns, `blocks` once every pushable
 * block has been moved. Things that wait on one latch when it first holds, until the room is entered again.
 */
export type RoomSignal = 'clear' | 'switches' | 'braziers' | 'blocks';

/** What a chest holds: an item (dungeon items go into the dungeon's state), or silver with its own line. */
export type ChestGift =
  { readonly item: ItemId; readonly n?: number } | { readonly silver: number; readonly text: L10n };

/** Things placed on a screen. The union grows with each milestone. */
export type Thing =
  /**
   * An enemy, present while `when` holds (night-only draugr); `onDeath` applies when it is killed. One
   * `asleep` lies still, harmless and untouchable until grave-gold is lifted in the room (it still counts
   * against the room's `clear`).
   */
  | {
      readonly k: 'enemy';
      readonly id: EnemyId;
      readonly at: TilePos;
      readonly when?: Cond;
      readonly onDeath?: readonly Effect[];
      /** Applies when the sunrise turns it to stone (a troll with `petrify`). */
      readonly onStone?: readonly Effect[];
      readonly asleep?: true;
    }
  | DoorThing
  /** Read with interact while facing its tile, or any tile of its `w`×`h` block (a 2×2 well). */
  | {
      readonly k: 'sign';
      readonly at: TilePos;
      readonly w?: number;
      readonly h?: number;
      readonly text: L10n;
    }
  /** Runs a script on interact while facing its tile or block (a bed, a well). */
  | {
      readonly k: 'use';
      readonly at: TilePos;
      readonly w?: number;
      readonly h?: number;
      readonly script: ScriptId;
      readonly when?: Cond;
    }
  /** Runs a script when the hero's feet enter the tile rectangle and `when` holds. */
  | {
      readonly k: 'trigger';
      readonly at: TilePos;
      readonly w: number;
      readonly h: number;
      readonly script: ScriptId;
      readonly when?: Cond;
    }
  /** A prop, present while `when` holds; `onBreak` applies when it is broken or split. */
  | {
      readonly k: 'prop';
      readonly id: PropId;
      readonly at: TilePos;
      readonly when?: Cond;
      readonly onBreak?: readonly Effect[];
    }
  /**
   * An animal, present while `when` holds. `tag` numbers penned sheep; `onGone` applies when it leaves
   * for good (a raven scared off).
   */
  | {
      readonly k: 'critter';
      readonly id: CritterId;
      readonly at: TilePos;
      readonly when?: Cond;
      readonly tag?: number;
      readonly onGone?: readonly Effect[];
    }
  /**
   * A pen: a tagged critter whose feet enter it stays inside, its tag bit is set in `world.vars[v]`, and
   * `flag` is set once `count` are in. A screen's first pen whose `when` holds is the one that counts (Ulf's
   * herding round pens the day-one flock afresh under its own var).
   */
  | {
      readonly k: 'pen';
      readonly at: TilePos;
      readonly w: number;
      readonly h: number;
      readonly v: string;
      readonly flag: FlagId;
      readonly count: number;
      readonly when?: Cond;
    }
  /**
   * A chest, opened once ever with interact (`id` is saved in `world.opened`). It is hidden, and not solid,
   * until `when` holds and the room gives the `appear` signal. With `learn` it also teaches a galdr (Ís
   * for good, past Garmr), and `text` replaces the gift's found line.
   */
  | {
      readonly k: 'chest';
      readonly id: string;
      readonly at: TilePos;
      readonly gives: ChestGift;
      readonly appear?: RoomSignal;
      readonly when?: Cond;
      readonly learn?: GaldrId;
      readonly text?: L10n;
      /** On the bottom of deep water under a ripple: a dive over it takes it, never interact. */
      readonly sunk?: true;
    }
  /** A heart container, taken once ever (saved in `world.opened`); hidden until `when` and `appear` hold. */
  | {
      readonly k: 'heart';
      readonly id: string;
      readonly at: TilePos;
      readonly appear?: RoomSignal;
      readonly when?: Cond;
    }
  /**
   * A locked door: walking into it with a small key opens it for good (`id` saved in the dungeon's doors).
   * A `big` one (the boss door) takes the dungeon's big key instead, which is kept.
   */
  | {
      readonly k: 'lock';
      readonly id: string;
      readonly at: TilePos;
      readonly w: number;
      readonly h: number;
      readonly big?: true;
    }
  /**
   * Bars that slam shut once Ask has stepped clear of them, and open when the room gives `opens`. While
   * `when` fails they stay open. With an `id` the opening is saved in the dungeon's doors, for good; one
   * with an id and no `opens` is the far side of a shutter in the next room, open once that one is.
   */
  | {
      readonly k: 'shutter';
      readonly id?: string;
      readonly at: TilePos;
      readonly w: number;
      readonly h: number;
      readonly opens?: RoomSignal;
      readonly when?: Cond;
    }
  /**
   * A switch stone: a sword or boomerang strike lights it for as long as Ask stays in the room. With `set`,
   * the strike also sets that flag, and the switch is lit whenever the flag holds (a latch, for good). An
   * `eye` (carved in stone) opens only to an arrow; anything else clinks off it.
   */
  | {
      readonly k: 'switch';
      readonly at: TilePos;
      readonly set?: FlagId;
      readonly eye?: true;
      /** A wind fan (M7b): only a Vindr gust spins it; no blade, shot or blast does. */
      readonly fan?: true;
    }
  /** A drawbridge over water or a gap: its tiles are walkable while `down` holds. */
  | {
      readonly k: 'bridge';
      readonly at: TilePos;
      readonly w: number;
      readonly h: number;
      readonly down: Cond;
    }
  /**
   * A cracked wall or rock pile: solid until a blast opens it, for good (`id` saved in `world.opened`). A
   * crack on a room edge is authored in both rooms under one id.
   */
  | {
      readonly k: 'crack';
      readonly id: string;
      readonly at: TilePos;
      readonly w: number;
      readonly h: number;
      /**
       * `wall` and `rock` open to a blast; `floor` (a weak floor over a way down) only to the hammer or
       * Skjálfti, and `stake` (a dwarf stake across the way) only to the hammer (M8b).
       */
      readonly art: 'wall' | 'rock' | 'floor' | 'stake';
    }
  /**
   * A mill wheel: struck (sword, boomerang or blast) it sets the screen's water level to `level`, unless
   * that would change the footing under Ask. It shows turned while the water stands at its level.
   */
  | { readonly k: 'wheel'; readonly at: TilePos; readonly level: 0 | 1 | 2 }
  /**
   * A warp stone: interact wakes it for good (its region goes into `world.warps`); Farvegr's song brings
   * Ask back to `arrive`. Always solid.
   */
  | { readonly k: 'warp'; readonly region: RegionId; readonly at: TilePos; readonly arrive: TilePos }
  /** A rune seal (the pass's three): a solid pillar whose rune burns while `lit` holds. */
  | { readonly k: 'seal'; readonly at: TilePos; readonly lit: Cond }
  /** A grapple post: a solid iron-bound pillar the grapple chain hooks, pulling Ask to the tile before it. */
  | { readonly k: 'post'; readonly at: TilePos }
  /**
   * A window of rime-light (M9b): while `when` holds, a beam shines from it `dir` across the room, turned
   * by prisms and Ask's raised mirror, through clear ice, until something solid stops it. Solid.
   */
  | { readonly k: 'beam'; readonly at: TilePos; readonly dir: Dir4; readonly when?: Cond }
  /**
   * A glass prism (M9b): it turns a beam a quarter, `/` (east to north, south to west) or `\` (east to
   * south, north to west). With `turns`, a sword blow or a Bragð beam swaps the two until Ask leaves the room.
   * Solid.
   */
  | { readonly k: 'prism'; readonly at: TilePos; readonly turn: '/' | '\\'; readonly turns?: true }
  /** A crystal eye (M9b): the first beam (or Bragð beam) to reach it sets `flag` for good. Solid. */
  | { readonly k: 'eye'; readonly at: TilePos; readonly flag: FlagId }
  /**
   * A raft, 2×2 tiles, resting at `at` (its top-left tile) and plying a straight line through each stop of
   * `path` and back again. Resting, it is footing; Ask aboard as it sets off rides along. Never saved.
   */
  | {
      readonly k: 'raft';
      readonly at: TilePos;
      readonly path: readonly TilePos[];
      /** A sail (M7b): the raft never leaves a stop until a Vindr gust fills it. */
      readonly sail?: true;
    }
  /** A brazier: lit from the lantern in an item slot; `lit` ones burn from the start. */
  | { readonly k: 'brazier'; readonly at: TilePos; readonly lit?: boolean }
  /** A piece of heart, collected once ever (`id` is saved in `world.pieces`). */
  | { readonly k: 'piece'; readonly id: string; readonly at: TilePos; readonly sunk?: true }
  /**
   * A herb that grows in one season: walking over it picks `item`, and it stays gone until that season
   * comes round again (`world.vars[id]` holds the season epoch it was picked in, plus one).
   */
  | {
      readonly k: 'herb';
      readonly id: string;
      readonly item: ItemId;
      readonly at: TilePos;
      readonly season: Season;
    }
  /** Burning tiles (the raid): they hurt on touch and are not solid; out while `when` fails. */
  | { readonly k: 'fire'; readonly at: TilePos; readonly w: number; readonly h: number; readonly when?: Cond }
  /** A barrier of tiles, solid while `closed` holds: a palisade gate, a wall of fire, piled logs. */
  | {
      readonly k: 'gate';
      readonly at: TilePos;
      readonly w: number;
      readonly h: number;
      readonly art: GateArt;
      readonly closed: Cond;
      /** Ice that fire melts: an Eldr bolt reaching a closed tile sets this flag (the rime across the gorge). */
      readonly melts?: FlagId;
      /** A web that wind tears away: a Vindr gust reaching a closed tile sets this flag (M7b). */
      readonly blows?: FlagId;
    }
  /**
   * Scenery drawn over the map, tile by tile, when `shown` holds as the screen is entered (raid ruins
   * until the farm is rebuilt). It never blocks the way.
   */
  | {
      readonly k: 'scenery';
      readonly at: TilePos;
      readonly w: number;
      readonly h: number;
      readonly art: SceneryArt;
      readonly shown: Cond;
    }
  /**
   * Setting down (or throwing) an `accepts` prop inside the rectangle applies `do` and uses it up, while
   * `when` holds (a target already hit takes no more).
   */
  | {
      readonly k: 'drop';
      readonly at: TilePos;
      readonly w: number;
      readonly h: number;
      readonly accepts: PropId;
      readonly do: readonly Effect[];
      readonly when?: Cond;
    };

/**
 * Scenery that comes and goes with the story: what the raid left (scorched roofs, a burned fold, boarded
 * doors), Hildr's wattle hurdles on the heath, the wild bees' hive in the pines, and Oddr's skiff.
 */
export type SceneryArt = 'scorch' | 'rubble' | 'boards' | 'hurdle' | 'hive' | 'skiff';

/**
 * A gate's look: `slab` is a barrow's stone door, `rime` the Rime King's ice across the pass, `bars` a
 * captive's cell in Helgrind, `web` a spider's web across the way in Myrkviðr.
 */
export type GateArt = 'palisade' | 'fire' | 'logs' | 'slab' | 'rime' | 'bars' | 'web';

export interface ScreenDef {
  readonly id: ScreenId;
  readonly region: RegionId;
  /** Design note: why this screen exists ("every screen has a reason"). Not shown to players. */
  readonly purpose: string;
  /** 22 rows of 40 legend characters. */
  readonly map: readonly string[];
  readonly things: readonly Thing[];
  /** Interiors: no weather, a fixed indoor light. */
  readonly indoor?: boolean;
  /** No light of its own (a cave): only the lantern and fires show anything. */
  readonly dark?: boolean;
  /** Filled with fog (a Helgrind room): only a small circle round Ask shows, or the lantern's light. */
  readonly fog?: boolean;
  /** A dungeon room: its grid in `layout.dungeons`; the clock stops and there is no weather. */
  readonly dungeon?: DungeonId;
  /** Where the region's spawn table may put enemies (see ContentDb.spawns). None: nothing rolled here. */
  readonly spawns?: readonly TilePos[];
  /** The flag holding this screen's water level, for terrains that `rise` (see world/water.ts). */
  readonly water?: FlagId;
  /** A forge room or vent field (M8): heat builds on Ask while Ask is here (see systems/heat.ts). */
  readonly hot?: true;
  /** Under Hrímfjöll's killing frost (M9): cold builds on Ask here unless Ask wears the ember byrnie. */
  readonly cold?: true;
  /** A lever's flag that turns every conveyor belt on the screen the other way while it is set. */
  readonly belts?: { readonly flag: FlagId };
}

/** A grid of screens: the overworld, or one floor of a dungeon. */
export interface ScreenGrid {
  readonly cols: number;
  readonly rows: number;
  readonly at: Readonly<Partial<Record<ScreenId, readonly [number, number]>>>;
}

export interface WorldLayout extends ScreenGrid {
  /** Dungeon floors: rooms slide into each other like overworld screens, never across grids. */
  readonly dungeons?: Readonly<Partial<Record<DungeonId, ScreenGrid>>>;
}

export interface LayoutIndex {
  /** A screen's cell in its own grid (the overworld or its dungeon). */
  pos(id: ScreenId): readonly [number, number] | undefined;
  /** The screen at a cell of the overworld (`grid` null) or of a dungeon's grid. */
  idAt(gx: number, gy: number, grid?: DungeonId | null): ScreenId | undefined;
  /** The dungeon whose grid holds the screen; null for the overworld and for off-grid screens. */
  gridOf(id: ScreenId): DungeonId | null;
  /**
   * World-pixel origin. Screens off every grid (interiors) get pockets in a row below the overworld; each
   * dungeon grid gets its own block below those.
   */
  origin(id: ScreenId): Vec;
}

/** Indexes the overworld and dungeon grids; `ids` (all screens, in a stable order) decides the pockets. */
export function indexLayout(layout: WorldLayout, ids: readonly ScreenId[]): LayoutIndex {
  const grids: [DungeonId | null, ScreenGrid][] = [
    [null, layout],
    ...(Object.entries(layout.dungeons ?? {}) as [DungeonId, ScreenGrid][]),
  ];
  const byPos = new Map<string, ScreenId>();
  const cell = new Map<ScreenId, readonly [number, number]>();
  const gridOf = new Map<ScreenId, DungeonId | null>();
  for (const [grid, g] of grids) {
    for (const [id, pos] of Object.entries(g.at) as [ScreenId, readonly [number, number] | undefined][]) {
      if (pos === undefined) continue;
      if (cell.has(id)) throw new Error(`layout: ${id} is on two grids`);
      const key = `${grid ?? 'world'}:${pos[0]},${pos[1]}`;
      const taken = byPos.get(key);
      if (taken !== undefined) throw new Error(`layout: ${taken} and ${id} both at ${key}`);
      byPos.set(key, id);
      cell.set(id, pos);
      gridOf.set(id, grid);
    }
  }
  const pockets = new Map<ScreenId, number>();
  for (const id of ids) if (!cell.has(id)) pockets.set(id, pockets.size);
  // Below the overworld: one row of pockets, then each dungeon grid, a screen apart.
  const top = new Map<DungeonId, number>();
  let y = layout.rows + 3;
  for (const [grid, g] of grids) {
    if (grid === null) continue;
    top.set(grid, y);
    y += g.rows + 1;
  }
  return {
    pos: (id) => cell.get(id),
    idAt: (gx, gy, grid = null) => byPos.get(`${grid ?? 'world'}:${gx},${gy}`),
    gridOf: (id) => gridOf.get(id) ?? null,
    origin: (id) => {
      const pos = cell.get(id);
      if (pos !== undefined) {
        const grid = gridOf.get(id) ?? null;
        const row = grid === null ? 0 : (top.get(grid) ?? 0);
        return { x: pos[0] * SCREEN_W, y: (row + pos[1]) * SCREEN_H };
      }
      const pocket = pockets.get(id);
      if (pocket === undefined) throw new Error(`screen ${id} is not indexed`);
      return { x: pocket * SCREEN_W, y: (layout.rows + 1) * SCREEN_H };
    },
  };
}

export function neighbourOf(index: LayoutIndex, id: ScreenId, dir: Dir4): ScreenId | null {
  const pos = index.pos(id);
  if (pos === undefined) return null;
  const d = DIR_VEC[dir];
  return index.idAt(pos[0] + d.x, pos[1] + d.y, index.gridOf(id)) ?? null;
}

/** World-pixel origin of any screen. */
export function screenOrigin(index: LayoutIndex, id: ScreenId): Vec {
  return index.origin(id);
}

/** Where something standing on a tile has its feet: horizontally centred, 2 px above the tile's bottom. */
export function tileFeet(at: TilePos): Vec {
  return { x: at.x * TILE + TILE / 2, y: at.y * TILE + TILE - 2 };
}
