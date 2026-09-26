import type { Raster } from '../raster';

/** One named frame. (ox, oy) is the entity's feet point inside the frame, in pixels. */
export interface SpriteFrame {
  readonly name: string;
  readonly raster: Raster;
  readonly ox: number;
  readonly oy: number;
}
