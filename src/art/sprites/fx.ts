import type { AnimDef } from '../anims';
import { ellipse, rect } from '../draw';
import { outline } from '../outline';
import { C } from '../palette';
import { blit, createRaster, hex, type Raster, type Rgba } from '../raster';
import type { SpriteFrame } from './types';

/** Ambient effects: a fish jumping out of the water and chimney smoke puffs. */

const INK = hex(C.ink);
const WATER = hex(C.water);
const WATER_LIGHT = hex(C.waterLight);
const STEEL = hex(C.steel);
const STEEL_SHADE = hex(C.steelShade);
const SMOKE: Rgba = [190, 190, 200, 170];
const SMOKE_LIGHT: Rgba = [216, 216, 224, 190];

/** Height of the fish above the surface per frame; null means it is still under. */
const FISH_Y: ReadonlyArray<number | null> = [null, 12, 8, 5, 4, 6, 9, 13];

function fish(): Raster {
  const r = createRaster(12, 8);
  ellipse(r, 6.5, 4, 3.5, 1.8, (x) => (x > 7 ? STEEL_SHADE : STEEL));
  rect(r, 1, 2, 2, 1, STEEL_SHADE);
  rect(r, 1, 5, 2, 1, STEEL_SHADE);
  rect(r, 2, 3, 1, 2, STEEL_SHADE);
  rect(r, 8, 3, 1, 1, INK);
  return outline(r, INK, 1);
}

function fishJump(f: number): Raster {
  const r = createRaster(24, 20);
  const rad = 5 + f * 0.5;
  ellipse(r, 12, 15, rad, rad * 0.4, WATER_LIGHT);
  ellipse(r, 12, 15, rad - 1.5, (rad - 1.5) * 0.4, WATER);
  const y = FISH_Y[f] ?? null;
  if (y !== null) blit(r, fish(), 6, y - 4);
  if (f >= 5) {
    for (const [x, dy] of [
      [6, 2],
      [18, 2],
      [8, 4],
      [16, 4],
    ] as const)
      rect(r, x, 15 - dy - (f - 5), 1, 1, WATER_LIGHT);
  }
  return r;
}

function puff(size: number): Raster {
  const r = createRaster(size, size);
  const c = size / 2;
  ellipse(r, c, c, c - 0.5, c - 0.5, SMOKE);
  ellipse(r, c - 1, c - 1, c / 2, c / 2, SMOKE_LIGHT);
  return r;
}

/** A streak of rain, slanting down to the left: the storm blows from the east. */
function raindrop(): Raster {
  const r = createRaster(6, 14);
  for (let i = 0; i < 12; i++) {
    const x = 4 - Math.floor(i / 3);
    r.data.set([196, 220, 240, 150 + i * 8], (i * 6 + x) * 4);
    r.data.set([160, 190, 220, 110 + i * 6], (i * 6 + x + 1) * 4);
  }
  return r;
}

/**
 * The shape a light cuts out of the dark: a disc in three steps of strength, so the edge reads as pixel
 * art rather than a smooth gradient. White; only its alpha matters.
 */
function light(): Raster {
  const size = 128;
  const r = createRaster(size, size);
  const c = size / 2;
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const d = Math.sqrt((x + 0.5 - c) ** 2 + (y + 0.5 - c) ** 2) / c;
      const a = d < 0.62 ? 255 : d < 0.82 ? 170 : d < 1 ? 85 : 0;
      if (a > 0) r.data.set([255, 255, 255, a], (y * size + x) * 4);
    }
  return r;
}

export function fxFrames(): SpriteFrame[] {
  const out: SpriteFrame[] = [];
  for (let f = 0; f < 8; f++) out.push({ name: `fx_fish_idle_s_${f}`, raster: fishJump(f), ox: 12, oy: 16 });
  [7, 9, 11].forEach((size, i) => {
    const half = Math.floor(size / 2);
    out.push({ name: `fx_smoke_idle_s_${i}`, raster: puff(size), ox: half, oy: half });
  });
  out.push({ name: 'fx_rain_idle_s_0', raster: raindrop(), ox: 3, oy: 7 });
  out.push({ name: 'fx_light_idle_s_0', raster: light(), ox: 64, oy: 64 });
  return out;
}

export const FX_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  fx_fish: { idle: { frames: 8, fps: 10, loop: false, dirs: ['s'] } },
  fx_smoke: { idle: { frames: 3, fps: 1, loop: true, dirs: ['s'] } },
  fx_rain: { idle: { frames: 1, fps: 1, loop: true, dirs: ['s'] } },
  fx_light: { idle: { frames: 1, fps: 1, loop: true, dirs: ['s'] } },
};
