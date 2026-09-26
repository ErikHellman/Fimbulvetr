import type { AnimDef } from '../anims';
import { decodeGrid, type GridPalette } from '../grid';
import { outline } from '../outline';
import { C } from '../palette';
import { blit, createRaster, getPixel, hex, setPixel, type Raster } from '../raster';
import type { SpriteFrame } from './types';

const PAL: GridPalette = {
  '.': null,
  k: C.sack,
  K: C.sackShade,
  e: C.ink,
  y: C.straw,
  Y: C.strawShade,
  g: C.wood,
  G: C.woodShade,
};

/** 16×24 straw training dummy. */
const GRID = [
  '......kkkk......',
  '....kkkkkkkK....',
  '...kkkkkkkkkK...',
  '...kkekkkkekK...',
  '...kkkkkkkkkK...',
  '...kkkkeekkkK...',
  '....KkkkkkkK....',
  '.......gG.......',
  'yyyyyyygGyyyyyyY',
  'YyyyyyygGyyyyyYY',
  '.......gG.......',
  '.....yyyyyy.....',
  '....yyyyyyyY....',
  '....yyYyyyyY....',
  '....yyyyyYyY....',
  '....yYyyyyyY....',
  '....yyyyyyyY....',
  '.....YYYYYY.....',
  '.......gG.......',
  '.......gG.......',
  '.......gG.......',
  '.......gG.......',
  '......ggGG......',
  '.....gggGGG.....',
];

const W = 20;
const H = 26;
/** Rows (in the padded raster) that wobble when the dummy is hit: the sack head and the crossbar. */
const WOBBLE_ROWS = 11;

function wobble(src: Raster, dx: number): Raster {
  const out = createRaster(src.w, src.h);
  for (let y = 0; y < src.h; y++) {
    for (let x = 0; x < src.w; x++) setPixel(out, x, y, getPixel(src, y < WOBBLE_ROWS ? x - dx : x, y));
  }
  return out;
}

export function dummyFrames(): SpriteFrame[] {
  const base = createRaster(W, H);
  blit(base, decodeGrid(GRID, PAL), 2, 1);
  const finish = (r: Raster): Raster => outline(r, hex(C.ink), 1);
  return [
    { name: 'prop_dummy_idle_s_0', raster: finish(base), ox: 10, oy: 25 },
    { name: 'prop_dummy_hurt_s_0', raster: finish(wobble(base, -1)), ox: 10, oy: 25 },
    { name: 'prop_dummy_hurt_s_1', raster: finish(wobble(base, 1)), ox: 10, oy: 25 },
  ];
}

export const DUMMY_ANIMS = {
  idle: { frames: 1, fps: 1, loop: true, dirs: ['s'] },
  hurt: { frames: 2, fps: 12, loop: true, dirs: ['s'] },
} satisfies Record<string, AnimDef>;
