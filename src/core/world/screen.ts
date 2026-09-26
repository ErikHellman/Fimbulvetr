import type { EnemyId, PropId, RegionId, ScriptId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import { DIR_VEC, type Dir4 } from '../math/dir';
import type { L10n } from '../i18n/t';
import type { Vec } from '../math/vec';
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
}

/** Things placed on a screen. The union grows with each milestone. */
export type Thing =
  | { readonly k: 'enemy'; readonly id: EnemyId; readonly at: TilePos }
  | DoorThing
  /** Read with interact while facing its tile. */
  | { readonly k: 'sign'; readonly at: TilePos; readonly text: L10n }
  /** Runs a script on interact while facing its tile (a bed, a well). */
  | { readonly k: 'use'; readonly at: TilePos; readonly script: ScriptId; readonly when?: Cond }
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
  /** Setting down (or throwing) an `accepts` prop inside the rectangle applies `do` and uses it up. */
  | {
      readonly k: 'drop';
      readonly at: TilePos;
      readonly w: number;
      readonly h: number;
      readonly accepts: PropId;
      readonly do: readonly Effect[];
    };

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
}

export interface WorldLayout {
  readonly cols: number;
  readonly rows: number;
  readonly at: Readonly<Partial<Record<ScreenId, readonly [number, number]>>>;
}

export interface LayoutIndex {
  pos(id: ScreenId): readonly [number, number] | undefined;
  idAt(gx: number, gy: number): ScreenId | undefined;
  /** World-pixel origin. Screens off the grid (interiors, dungeon rooms) get pockets below it. */
  origin(id: ScreenId): Vec;
}

/** Indexes the overworld grid; `ids` (all screens, in a stable order) decides the off-grid pockets. */
export function indexLayout(layout: WorldLayout, ids: readonly ScreenId[]): LayoutIndex {
  const byPos = new Map<string, ScreenId>();
  for (const [id, pos] of Object.entries(layout.at) as [ScreenId, readonly [number, number] | undefined][]) {
    if (pos === undefined) continue;
    const key = `${pos[0]},${pos[1]}`;
    const taken = byPos.get(key);
    if (taken !== undefined) throw new Error(`layout: ${taken} and ${id} both at ${key}`);
    byPos.set(key, id);
  }
  const pockets = new Map<ScreenId, number>();
  for (const id of ids) if (layout.at[id] === undefined) pockets.set(id, pockets.size);
  return {
    pos: (id) => layout.at[id],
    idAt: (gx, gy) => byPos.get(`${gx},${gy}`),
    origin: (id) => {
      const pos = layout.at[id];
      if (pos !== undefined) return { x: pos[0] * SCREEN_W, y: pos[1] * SCREEN_H };
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
  return index.idAt(pos[0] + d.x, pos[1] + d.y) ?? null;
}

/** World-pixel origin of any screen. */
export function screenOrigin(index: LayoutIndex, id: ScreenId): Vec {
  return index.origin(id);
}

/** Where something standing on a tile has its feet: horizontally centred, 2 px above the tile's bottom. */
export function tileFeet(at: TilePos): Vec {
  return { x: at.x * TILE + TILE / 2, y: at.y * TILE + TILE - 2 };
}
