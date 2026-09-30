import type { Dir4 } from '@core/math/dir';
import type { AnimDef } from '../anims';
import { ellipse, line, rect } from '../draw';
import { outline } from '../outline';
import { C } from '../palette';
import { createRaster, hex, type Raster } from '../raster';
import type { SpriteFrame } from './types';

/** Haugar and Konungshaugr: warp stones, the barrow's slab door, and what haunts the barrows. */

const INK = hex(C.ink);
const ROCK = hex(C.rock);
const ROCK_SHADE = hex(C.rockShade);
const ROCK_LIGHT = hex(C.rockLight);
const RUNE = hex(C.rune);
const RUNE_DIM = hex('#4c6a70');
const LICHEN = hex('#8a9a5a');

// ── The warp stone: one tile wide, standing 30 px tall, feet 2 px above the tile's bottom ─────────────

const STONE_H = 32;

/** A rune-cut standing stone; awake, its runes shine and a glow rings its foot. */
function warpStone(awake: boolean): Raster {
  const r = createRaster(18, STONE_H);
  const base = STONE_H - 3;
  if (awake) ellipse(r, 9, base, 8, 2.5, hex('#3f6a74'));
  // The stone: a tall slab, narrowing to a rounded head.
  rect(r, 4, 6, 10, base - 5, ROCK);
  ellipse(r, 9, 6, 5, 4, ROCK);
  rect(r, 11, 6, 3, base - 5, ROCK_SHADE);
  rect(r, 4, 5, 2, 10, ROCK_LIGHT);
  rect(r, 5, base - 6, 2, 2, LICHEN);
  // Runes down its face: a zigzag, a cross and a hooked stave.
  const c = awake ? RUNE : RUNE_DIM;
  line(r, 7, 8, 9, 10, c);
  line(r, 9, 10, 7, 12, c);
  line(r, 8, 15, 8, 19, c);
  line(r, 6, 17, 10, 17, c);
  line(r, 8, 22, 8, 26, c);
  line(r, 8, 22, 10, 24, c);
  return outline(r, INK, 1);
}

export function haugarFrames(): SpriteFrame[] {
  const fixture = (name: string, raster: Raster): SpriteFrame => ({ name, raster, ox: 9, oy: raster.h - 3 });
  return [fixture('fix_warp_dormant_s_0', warpStone(false)), fixture('fix_warp_awake_s_0', warpStone(true))];
}

const one = (frames: number, fps: number): AnimDef => ({ frames, fps, loop: true, dirs: ['s'] });
export const ALL_DIRS: readonly Dir4[] = ['s', 'n', 'w', 'e'];

export const HAUGAR_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  fix_warp: { dormant: one(1, 1), awake: one(1, 1) },
};
