import { packShelves } from '@art/pack';
import { blit, createRaster } from '@art/raster';
import { encodePng } from './png';
import type { DrawnFrame } from './sprite';

export interface AtlasFiles {
  readonly png: Buffer;
  readonly json: string;
}

/** Packs frames into one TexturePacker-style "JSON hash" atlas page with pivots (see docs/real-art.md). */
export function buildAtlas(image: string, frames: readonly DrawnFrame[], pageSize = 1024): AtlasFiles {
  const pack = packShelves(
    frames.map((f) => ({ name: f.name, w: f.raster.w, h: f.raster.h })),
    pageSize,
    1,
  );
  if (pack.heights.length !== 1) throw new Error(`${image}: frames do not fit one ${pageSize}px page`);
  const h = pack.heights[0] ?? 1;
  const page = createRaster(pageSize, h);
  const entries: Record<string, unknown> = {};
  for (const f of frames) {
    const at = pack.placements.get(f.name);
    if (at === undefined) throw new Error(`${f.name}: not placed`);
    blit(page, f.raster, at.x, at.y);
    entries[f.name] = {
      frame: { x: at.x, y: at.y, w: f.raster.w, h: f.raster.h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: f.raster.w, h: f.raster.h },
      sourceSize: { w: f.raster.w, h: f.raster.h },
      pivot: { x: f.pivot.x, y: f.pivot.y },
    };
  }
  const json = {
    frames: entries,
    meta: {
      app: 'fimbulvetr art-src',
      version: '1',
      image,
      format: 'RGBA8888',
      size: { w: pageSize, h },
      scale: '1',
    },
  };
  return { png: encodePng(page), json: JSON.stringify(json) };
}
