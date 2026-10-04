import type { Dir4 } from '@core/math/dir';
import type { AnimDef } from '../anims';
import { ellipse, line, rect } from '../draw';
import { createRaster, flipX, hex, setPixel, type Raster, type Rgba } from '../raster';
import type { SpriteFrame } from './types';

/** Helgrind (M6b): the grapple chain and its posts, and what stands in Hel's gate. */

const IRON = hex('#4a4f58');
const IRON_LIGHT = hex('#8a929e');
const IRON_DARK = hex('#23262c');
const STONE = hex('#2e2f36');
const STONE_LIGHT = hex('#4a4b55');
const STONE_DARK = hex('#1a1b20');

/** A grapple post: a squat black-stone pillar bound in iron, with a ring on top for the hook. */
function post(): Raster {
  const r = createRaster(18, 28);
  ellipse(r, 9, 25, 7, 2, () => [0, 0, 0, 90]);
  rect(r, 4, 9, 10, 16, STONE_DARK);
  rect(r, 4, 9, 8, 16, STONE);
  rect(r, 4, 9, 2, 16, STONE_LIGHT);
  // Two iron bands.
  rect(r, 3, 12, 12, 2, IRON);
  rect(r, 3, 12, 12, 1, IRON_LIGHT);
  rect(r, 3, 20, 12, 2, IRON);
  rect(r, 3, 20, 12, 1, IRON_LIGHT);
  // The cap and its ring.
  rect(r, 3, 7, 12, 3, IRON_DARK);
  rect(r, 3, 7, 12, 1, IRON);
  ellipse(r, 9, 4, 3.2, 3.2, (x, y) => ((x - 9) ** 2 + (y - 4) ** 2 > 3.5 ? IRON_LIGHT : STONE_DARK));
  return r;
}

/** The chain's head, a three-pronged hook, pointing east (the other ways are turned from it). */
function hookEast(): Raster {
  const r = createRaster(12, 12);
  rect(r, 0, 5, 6, 2, IRON);
  rect(r, 0, 5, 6, 1, IRON_LIGHT);
  line(r, 6, 6, 10, 2, IRON_LIGHT);
  line(r, 6, 6, 11, 6, IRON_LIGHT);
  line(r, 6, 6, 10, 10, IRON);
  setPixel(r, 9, 1, IRON_DARK);
  setPixel(r, 9, 11, IRON_DARK);
  return r;
}

/** Turns a square raster a quarter round, clockwise. */
function turn(src: Raster): Raster {
  const r = createRaster(src.h, src.w);
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const i = (y * src.w + x) * 4;
      const c: Rgba = [src.data[i] ?? 0, src.data[i + 1] ?? 0, src.data[i + 2] ?? 0, src.data[i + 3] ?? 0];
      if (c[3] !== 0) setPixel(r, src.h - 1 - y, x, c);
    }
  return r;
}

/** One link of the chain: a small iron ring. */
function link(): Raster {
  const r = createRaster(6, 6);
  rect(r, 0, 0, 6, 6, IRON);
  rect(r, 0, 0, 6, 1, IRON_LIGHT);
  rect(r, 0, 5, 6, 1, IRON_DARK);
  rect(r, 2, 2, 2, 2, [0, 0, 0, 0]);
  return r;
}

const PLANK = hex('#5a4632');
const PLANK_LIGHT = hex('#7a6246');
const PLANK_DARK = hex('#3a2c1e');
const ROPE = hex('#a89a72');

/** A raft of black-tarred planks lashed across two logs, 2×2 tiles, with a pixel of clear margin. */
function raft(): Raster {
  const r = createRaster(34, 34);
  rect(r, 2, 4, 30, 27, PLANK_DARK);
  for (let i = 0; i < 6; i++) {
    const y = 5 + i * 4;
    rect(r, 3, y, 28, 3, PLANK);
    rect(r, 3, y, 28, 1, PLANK_LIGHT);
  }
  // The lashings.
  for (const x of [6, 26]) {
    rect(r, x, 4, 2, 27, ROPE);
    rect(r, x + 1, 4, 1, 27, PLANK_DARK);
  }
  rect(r, 2, 31, 30, 1, [20, 24, 30, 140]);
  return r;
}

export function helgrindFrames(): SpriteFrame[] {
  const east = hookEast();
  const south = turn(east);
  const west = flipX(east);
  const north = turn(turn(south));
  const hooks: [Dir4, Raster][] = [
    ['e', east],
    ['s', south],
    ['w', west],
    ['n', north],
  ];
  return [
    { name: 'fix_post_idle_s_0', raster: post(), ox: 9, oy: 25 },
    ...hooks.map(([d, raster]) => ({ name: `fx_grapple_fly_${d}_0`, raster, ox: 6, oy: 6 })),
    { name: 'fx_chain_idle_s_0', raster: link(), ox: 3, oy: 3 },
    { name: 'fix_raft_idle_s_0', raster: raft(), ox: 17, oy: 31 },
  ];
}

const one = (frames: number, fps: number): AnimDef => ({ frames, fps, loop: true, dirs: ['s'] });
const ALL: readonly Dir4[] = ['s', 'n', 'w', 'e'];

export const HELGRIND_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  fix_post: { idle: one(1, 1) },
  fx_grapple: { fly: { frames: 1, fps: 1, loop: true, dirs: ALL } },
  fx_chain: { idle: one(1, 1) },
  fix_raft: { idle: one(1, 1) },
};
