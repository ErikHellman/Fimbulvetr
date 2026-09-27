import type { AnimDef } from '../anims';
import { ellipse, line, rect } from '../draw';
import { outline } from '../outline';
import { C } from '../palette';
import { createRaster, hex, type Raster } from '../raster';
import type { SpriteFrame } from './types';

/** Rótarhellir, the root cave: its pushable root blocks and hanging vines (one tile each). */
const INK = hex(C.ink);
const ROOT = hex(C.root);
const ROOT_SHADE = hex(C.rootShade);
const ROOT_LIGHT = hex(C.rootLight);
const VINE = hex(C.vine);
const VINE_SHADE = hex(C.vineShade);
const VINE_LIGHT = hex(C.vineLight);

/** 18 px wide (a 1 px margin around the tile), feet on the bottom row like props. */
const W = 18;

function propFrame(name: string, raster: Raster): SpriteFrame {
  return { name, raster, ox: Math.floor(raster.w / 2), oy: raster.h - 1 };
}

/** A knot of roots as big as a tile: three coiled strands bound round a core. */
function rootBlock(): Raster {
  const h = 20;
  const r = createRaster(W, h);
  ellipse(r, 9, 11, 7.5, 7.5, ROOT);
  ellipse(r, 10.5, 12.5, 5, 5.5, ROOT_SHADE);
  ellipse(r, 8, 10, 4.5, 4.5, ROOT);
  for (const [x0, y0, x1, y1] of [
    [2, 8, 15, 14],
    [3, 14, 14, 5],
    [5, 4, 12, 17],
  ] as const) {
    line(r, x0, y0, x1, y1, ROOT_SHADE);
    line(r, x0, y0 - 1, x1, y1 - 1, ROOT_LIGHT);
  }
  rect(r, 6, 8, 3, 2, ROOT_LIGHT);
  rect(r, 3, h - 3, 12, 1, ROOT_SHADE);
  return outline(r, INK, 1);
}

/** A curtain of vines hanging across a passage, strands swaying by a pixel. */
function vines(): Raster {
  const h = 22;
  const r = createRaster(W, h);
  rect(r, 1, 1, 16, 3, VINE_SHADE);
  for (let i = 0; i < 6; i++) {
    const x = 2 + i * 3 - (i % 2);
    const len = h - 6 - ((i * 5) % 4);
    for (let y = 3; y < 3 + len; y++) {
      const sway = Math.floor((y + i) / 5) % 2;
      rect(r, x + sway, y, 2, 1, i % 2 === 0 ? VINE : VINE_SHADE);
    }
    ellipse(r, x + 1, 3 + len - 1, 1.6, 1.6, VINE_LIGHT);
  }
  return outline(r, INK, 1);
}

export function caveFrames(): SpriteFrame[] {
  return [propFrame('prop_root_block_idle_s_0', rootBlock()), propFrame('prop_vines_idle_s_0', vines())];
}

const ONE: AnimDef = { frames: 1, fps: 1, loop: true, dirs: ['s'] };

export const CAVE_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  prop_root_block: { idle: ONE },
  prop_vines: { idle: ONE },
};
