import type { EnemyId, RegionId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import { DIR_VEC, type Dir4 } from '../math/dir';
import type { Vec } from '../math/vec';
import { SCREEN_H, SCREEN_W, TILE } from './dims';

export interface TilePos {
  readonly x: number;
  readonly y: number;
}

/** Things placed on a screen. The union grows with each milestone (npc, chest, door, secret, trigger…). */
export type Thing = { readonly k: 'enemy'; readonly id: EnemyId; readonly at: TilePos };

export interface ScreenDef {
  readonly id: ScreenId;
  readonly region: RegionId;
  /** Design note: why this screen exists ("every screen has a reason"). Not shown to players. */
  readonly purpose: string;
  /** 22 rows of 40 legend characters. */
  readonly map: readonly string[];
  readonly things: readonly Thing[];
}

export interface WorldLayout {
  readonly cols: number;
  readonly rows: number;
  readonly at: Readonly<Partial<Record<ScreenId, readonly [number, number]>>>;
}

export interface LayoutIndex {
  pos(id: ScreenId): readonly [number, number] | undefined;
  idAt(gx: number, gy: number): ScreenId | undefined;
}

export function indexLayout(layout: WorldLayout): LayoutIndex {
  const byPos = new Map<string, ScreenId>();
  for (const [id, pos] of Object.entries(layout.at) as [ScreenId, readonly [number, number] | undefined][]) {
    if (pos === undefined) continue;
    const key = `${pos[0]},${pos[1]}`;
    const taken = byPos.get(key);
    if (taken !== undefined) throw new Error(`layout: ${taken} and ${id} both at ${key}`);
    byPos.set(key, id);
  }
  return {
    pos: (id) => layout.at[id],
    idAt: (gx, gy) => byPos.get(`${gx},${gy}`),
  };
}

export function neighbourOf(index: LayoutIndex, id: ScreenId, dir: Dir4): ScreenId | null {
  const pos = index.pos(id);
  if (pos === undefined) return null;
  const d = DIR_VEC[dir];
  return index.idAt(pos[0] + d.x, pos[1] + d.y) ?? null;
}

/** World-pixel origin of a screen on the overworld grid. */
export function screenOrigin(index: LayoutIndex, id: ScreenId): Vec {
  const pos = index.pos(id);
  if (pos === undefined) throw new Error(`screen ${id} is not on the world layout`);
  return { x: pos[0] * SCREEN_W, y: pos[1] * SCREEN_H };
}

/** Where something standing on a tile has its feet: horizontally centred, 2 px above the tile's bottom. */
export function tileFeet(at: TilePos): Vec {
  return { x: at.x * TILE + TILE / 2, y: at.y * TILE + TILE - 2 };
}
