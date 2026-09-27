import type { TileAnim } from '@art/tiles/tileset';

/** Phaser's per-tile animation record, as `Tileset.tileData[localId]` expects it. */
export interface TileAnimation {
  readonly animation: readonly {
    readonly tileid: number;
    readonly duration: number;
    readonly startTime: number;
  }[];
  readonly animationDuration: number;
}

/** Tile animations keyed by their frame-0 tile. Every frame starts where the previous one ended. */
export function tileData(anims: readonly TileAnim[]): Record<number, TileAnimation> {
  const out: Record<number, TileAnimation> = {};
  for (const a of anims) {
    out[a.tile] = {
      animation: a.frames.map((tileid, i) => ({ tileid, duration: a.frameMs, startTime: i * a.frameMs })),
      animationDuration: a.frames.length * a.frameMs,
    };
  }
  return out;
}

/** Writes the animations into a Phaser tileset (its `tileData` is keyed by local id). Returns how many. */
export function animateTiles(target: { readonly tileData: object }, anims: readonly TileAnim[]): number {
  const data = tileData(anims);
  Object.assign(target.tileData, data);
  return Object.keys(data).length;
}
