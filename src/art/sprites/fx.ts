import type { AnimDef } from '../anims';
import { ellipse, rect } from '../draw';
import { outline } from '../outline';
import { C } from '../palette';
import { blit, createRaster, hex, type Raster, type Rgba } from '../raster';
import type { SpriteFrame } from './types';

/** Ambient effects: a fish jumping out of the water, chimney smoke puffs, and weather particles. */

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

/** A straight streak of rain; the view slants the fall with the wind. */
function drop(): Raster {
  const r = createRaster(2, 10);
  for (let i = 0; i < 10; i++) {
    r.data.set([196, 220, 240, 110 + i * 12], i * 2 * 4);
    if (i > 3) r.data.set([160, 190, 220, 90 + i * 8], (i * 2 + 1) * 4);
  }
  return r;
}

/** A snowflake: a soft white dot (small) or a little cross (large). */
function flake(large: boolean): Raster {
  const r = createRaster(3, 3);
  const white: Rgba = [250, 252, 255, 235];
  const soft: Rgba = [220, 230, 245, 170];
  r.data.set(white, (1 * 3 + 1) * 4);
  if (large)
    for (const [x, y] of [
      [0, 1],
      [2, 1],
      [1, 0],
      [1, 2],
    ] as const)
      r.data.set(soft, (y * 3 + x) * 4);
  return r;
}

/** A leaf tumbling on the wind, in three autumn colours. */
function windLeaf(i: number): Raster {
  const r = createRaster(4, 3);
  const c = hex([C.autumn, C.autumnLight, C.ember][i] ?? C.autumn);
  rect(r, 0, 1, 3, 1, c);
  rect(r, 1, 0, 2, 1, c);
  rect(r, 3, 2, 1, 1, hex(C.autumnShade));
  return r;
}

/** Eldr's bolt: a ball of fire with a white-hot heart, flickering over three frames. */
function eldr(i: number): Raster {
  const r = createRaster(14, 14);
  const flick = [0, 1, 0.5][i] ?? 0;
  ellipse(r, 7, 7, 6 + flick * 0.5, 5.5 + flick * 0.5, hex(C.ember));
  ellipse(r, 7, 7, 4.2, 4, hex(C.emberLight));
  ellipse(r, 7 - flick, 6.5, 2, 2, [255, 250, 230, 255]);
  for (const [x, y] of [
    [1 + i, 3],
    [12 - i, 10],
    [3, 11 - i],
  ] as const)
    r.data.set(hex(C.emberLight), (y * 14 + x) * 4);
  return r;
}

/** An Ís bolt: a pale shard of frost with a glinting core, flickering through three frames. */
function isBolt(i: number): Raster {
  const r = createRaster(14, 14);
  const flick = [0, 1, 0.5][i] ?? 0;
  ellipse(r, 7, 7, 5.5 + flick * 0.5, 5 + flick * 0.5, hex(C.iceShade));
  ellipse(r, 7, 7, 4, 3.6, hex(C.ice));
  ellipse(r, 7 + flick, 6.5, 1.8, 1.8, [250, 255, 255, 255]);
  for (const [x, y] of [
    [2 + i, 2],
    [11 - i, 11],
    [2, 10 - i],
  ] as const)
    r.data.set(hex(C.iceLight), (y * 14 + x) * 4);
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

/** The fishing float: red over white, bobbing (`idle` 0–1), twitching (`nibble`) or pulled under (`bite`). */
function float(sink: number): Raster {
  const r = createRaster(8, 10);
  const y = 1 + sink;
  if (sink < 4) {
    rect(r, 2, y, 4, 2, hex(C.heart));
    rect(r, 2, y + 2, 4, 2, hex(C.wool));
  } else {
    // Gone under: only the rings it left.
    rect(r, 0, 5, 8, 3, hex(C.waterLight));
    rect(r, 2, 6, 4, 1, hex(C.water));
  }
  rect(r, 0, 8, 8, 1, hex(C.waterLight));
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
  out.push({ name: 'fx_drop_idle_s_0', raster: drop(), ox: 1, oy: 5 });
  for (let i = 0; i < 3; i++) out.push({ name: `fx_eldr_fly_s_${i}`, raster: eldr(i), ox: 7, oy: 12 });
  for (let i = 0; i < 3; i++) out.push({ name: `fx_is_fly_s_${i}`, raster: isBolt(i), ox: 7, oy: 12 });
  out.push({ name: 'fx_snow_idle_s_0', raster: flake(false), ox: 1, oy: 1 });
  out.push({ name: 'fx_snow_idle_s_1', raster: flake(true), ox: 1, oy: 1 });
  for (let i = 0; i < 3; i++) out.push({ name: `fx_leaf_idle_s_${i}`, raster: windLeaf(i), ox: 2, oy: 1 });
  out.push({ name: 'fx_float_idle_s_0', raster: float(0), ox: 4, oy: 8 });
  out.push({ name: 'fx_float_idle_s_1', raster: float(1), ox: 4, oy: 8 });
  out.push({ name: 'fx_float_nibble_s_0', raster: float(2), ox: 4, oy: 8 });
  out.push({ name: 'fx_float_nibble_s_1', raster: float(0), ox: 4, oy: 8 });
  out.push({ name: 'fx_float_bite_s_0', raster: float(4), ox: 4, oy: 8 });
  return out;
}

export const FX_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  fx_fish: { idle: { frames: 8, fps: 10, loop: false, dirs: ['s'] } },
  fx_smoke: { idle: { frames: 3, fps: 1, loop: true, dirs: ['s'] } },
  fx_rain: { idle: { frames: 1, fps: 1, loop: true, dirs: ['s'] } },
  fx_light: { idle: { frames: 1, fps: 1, loop: true, dirs: ['s'] } },
  fx_drop: { idle: { frames: 1, fps: 1, loop: true, dirs: ['s'] } },
  fx_eldr: { fly: { frames: 3, fps: 14, loop: true, dirs: ['s'] } },
  fx_is: { fly: { frames: 3, fps: 14, loop: true, dirs: ['s'] } },
  fx_snow: { idle: { frames: 2, fps: 1, loop: true, dirs: ['s'] } },
  fx_leaf: { idle: { frames: 3, fps: 1, loop: true, dirs: ['s'] } },
  fx_float: {
    idle: { frames: 2, fps: 2, loop: true, dirs: ['s'] },
    nibble: { frames: 2, fps: 12, loop: true, dirs: ['s'] },
    bite: { frames: 1, fps: 1, loop: true, dirs: ['s'] },
  },
};
