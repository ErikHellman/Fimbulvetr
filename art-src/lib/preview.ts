import { createRaster, getPixel, setPixel, type Raster } from '@art/raster';
import { encodePng } from './png';
import type { DrawnFrame } from './sprite';

/** A contact sheet of frames scaled up, for review: `cols` per row, each cell the largest frame's size. */
export function previewSheet(
  frames: readonly DrawnFrame[],
  scale = 4,
  cols = 8,
  bg = [52, 48, 60, 255] as const,
): Buffer {
  const cell = Math.max(...frames.map((f) => Math.max(f.raster.w, f.raster.h)), 1);
  const rows = Math.ceil(frames.length / cols);
  const out = createRaster(cols * cell * scale, rows * cell * scale);
  for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++) setPixel(out, x, y, bg);
  frames.forEach((f, i) => {
    const ox = (i % cols) * cell * scale;
    const oy = Math.floor(i / cols) * cell * scale;
    for (let y = 0; y < f.raster.h; y++)
      for (let x = 0; x < f.raster.w; x++) {
        const c = getPixel(f.raster, x, y);
        if (c[3] === 0) continue;
        for (let sy = 0; sy < scale; sy++)
          for (let sx = 0; sx < scale; sx++) setPixel(out, ox + x * scale + sx, oy + y * scale + sy, c);
      }
  });
  return encodePng(out);
}

/** Frames scaled and laid side by side on one row, for an animation strip. */
export const previewStrip = (frames: readonly DrawnFrame[], scale = 4): Buffer =>
  previewSheet(frames, scale, Math.max(1, frames.length));

export type { Raster };
