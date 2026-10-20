import { line } from '@art/draw';
import { outline } from '@art/outline';
import { C } from '@art/palette';
import { blit, createRaster, getPixel, hex, setPixel, type Raster } from '@art/raster';
import type { Look } from '@art/sprites/people';
import type { Coat } from '../enemies/palette';
import { wolfFrames, wolfRaw, type WolfPose } from '../enemies/wolf';
import { grid, mirror, type DrawnFrame } from '../lib/sprite';
import { SHIELD_DOWN } from './grids2';
import { TOWER_PAL } from './palette';
import { grow, INK, NO_GEAR, PIVOT_KING, Wight, type Arms, type Side } from './wights';

/**
 * Helgrind's foes: the hel-hounds (the wolf in a black coat with ember eyes), Garmr (the hound grown half
 * again, three-headed, an iron ring at its collar) and Náströnd the Hollow (a gaunt draugr lord grown
 * half again behind a tower shield, then bare with a chain-flail), and the shield where it fell.
 */

const HELHOUND: Coat = {
  fur: '#2a2426',
  shade: '#16120f',
  light: '#4a3e3a',
  eye: '#ff5a20',
  bone: '#d8d0c0',
};
const GARMR: Coat = {
  fur: '#3a2a26',
  shade: '#1e1412',
  light: '#6a4a40',
  eye: '#ffb030',
  bone: '#d8d0c0',
  ruff: '#7a2a20',
};

/** A copy of a rectangle of `src`. */
function crop(src: Raster, x: number, y: number, w: number, h: number): Raster {
  const r = createRaster(w, h);
  for (let yy = 0; yy < h; yy++)
    for (let xx = 0; xx < w; xx++) setPixel(r, xx, yy, getPixel(src, x + xx, y + yy));
  return r;
}

/** Where the grown (48 px) wolf's head sits, by side: the rectangle copied for Garmr's other two heads. */
const HEAD: Readonly<Record<Side, readonly [number, number, number, number]>> = {
  w: [1, 15, 21, 20],
  s: [7, 15, 30, 18],
  n: [7, 15, 30, 14],
};
/** Where the two extra heads go, relative to the first: one behind (drawn first), one in front. */
const HEADS: Readonly<Record<Side, readonly [readonly [number, number], readonly [number, number]]>> = {
  w: [
    [6, -8],
    [3, 6],
  ],
  s: [
    [-10, -5],
    [10, -5],
  ],
  n: [
    [-9, 1],
    [9, 1],
  ],
};

/** Garmr: 48×54, feet at (24, 49). */
function garmr(side: Side, phase: number, pose: WolfPose): Raster {
  const body = grow(wolfRaw(side, phase, pose, GARMR));
  const [hx, hy, hw, hh] = HEAD[side];
  const head = crop(body, hx, hy, hw, hh);
  const [back, front] = HEADS[side];
  const r = createRaster(48, 54);
  const top = 4;
  blit(r, head, hx + back[0], hy + back[1] + top);
  blit(r, head, hx + front[0], hy + front[1] + top);
  blit(r, body, 0, top);
  const out = outline(r, INK, 1);
  // The collar and its ring, where the grapple bites.
  const ring = hex('#a8b0bc');
  const cx = side === 'w' ? 18 : 24;
  const cy = (side === 'w' ? 34 : 36) + top;
  for (const [dx, dy] of [
    [-2, 0],
    [2, 0],
    [0, -2],
    [0, 2],
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const)
    setPixel(out, cx + dx, cy + dy, ring);
  setPixel(out, cx, cy, INK);
  return out;
}

const HOLLOW_LOOK: Look = {
  skin: '#7c8a8e',
  hair: '#1a1c22',
  hairStyle: 'long',
  beard: '#2a2e36',
  top: '#2c3440',
  legs: 'pants',
  bottom: '#1c2028',
};

/** The tower shield standing: `h` rows of planks in an iron rim with a boss. */
function tower(r: Raster, x: number, y: number, w: number, h: number): void {
  const rim = hex('#7a828e');
  const plank = hex('#3a3026');
  const seam = hex('#2a2219');
  const boss = hex('#c8ccd4');
  for (let yy = 0; yy < h; yy++)
    for (let xx = 0; xx < w; xx++) {
      const edge = xx === 0 || yy === 0 || xx === w - 1 || yy === h - 1;
      setPixel(r, x + xx, y + yy, edge ? rim : (yy - 2) % 5 === 0 ? seam : plank);
    }
  for (const [dx, dy] of [
    [0, 0],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ] as const)
    setPixel(r, x + Math.floor(w / 2) + dx, y + Math.floor(h / 2) + dy, boss);
}

type HollowPose = 'rest' | 'raise' | 'cut' | 'flail';

export function helgrindFrames(): DrawnFrame[] {
  const out: DrawnFrame[] = [...wolfFrames('enemy_helhound', HELHOUND, false)];
  const add = (
    art: string,
    anim: string,
    side: Side,
    i: number,
    raster: Raster,
    pivot: { x: number; y: number },
  ): void => {
    out.push({ name: `${art}_${anim}_${side}_${i}`, raster, pivot });
    if (side === 'w') out.push({ name: `${art}_${anim}_e_${i}`, raster: mirror(raster), pivot });
  };
  const garmrPivot = { x: 0.5, y: 49 / 54 };
  const hollow = new Wight(HOLLOW_LOOK, { eyes: '#7ff0ff', rise: 'mist' });
  const steel = hex(C.steel);
  const flail = hex('#5a606a');
  const hollowAt = (side: Side, step: number, pose: HollowPose, bare: boolean): Raster => {
    const arms: Arms = pose === 'raise' || pose === 'flail' ? 'up' : pose === 'cut' ? 'forward' : 'down';
    const figure = grow(hollow.figure(side, step, arms, NO_GEAR));
    const r = createRaster(48, 54);
    blit(r, figure, 0, 6);
    if (pose === 'flail') {
      line(r, 24, 14, 40, 6, flail);
      line(r, 24, 14, 8, 6, flail);
      for (const cx of [41, 7])
        for (let dy = -3; dy <= 3; dy++)
          for (let dx = -3; dx <= 3; dx++) if (dx * dx + dy * dy <= 9) setPixel(r, cx + dx, 6 + dy, flail);
    } else if (pose === 'cut') {
      if (side === 'w') for (let x = 2; x < 16; x++) for (let y = 32; y < 35; y++) setPixel(r, x, y, steel);
      else for (let x = 33; x < 36; x++) for (let y = 30; y < 42; y++) setPixel(r, x, y, steel);
    }
    if (!bare) {
      if (side === 's') tower(r, 6, 22, 14, 26);
      else if (side === 'w') tower(r, 4, 20, 10, 28);
      else tower(r, 30, 22, 12, 24);
    }
    return outline(r, INK, 1);
  };
  for (const side of ['s', 'w', 'n'] as const) {
    const g = (anim: string, i: number, r: Raster): void => {
      add('enemy_garmr', anim, side, i, r, garmrPivot);
    };
    g('sleep', 0, garmr(side, 0, 'crouch'));
    g('idle', 0, garmr(side, 0, 'stand'));
    for (let i = 0; i < 4; i++) g('walk', i, garmr(side, i, 'stand'));
    g('tell', 0, garmr(side, 0, 'crouch'));
    g('tell', 1, garmr(side, 2, 'crouch'));
    g('breath', 0, garmr(side, 0, 'howl'));
    g('breath', 1, garmr(side, 2, 'howl'));
    g('lunge', 0, garmr(side, 0, 'lunge'));
    g('lunge', 1, garmr(side, 2, 'lunge'));
    g('roar', 0, garmr(side, 0, 'howl'));
    g('reel', 0, garmr(side, 2, 'crouch'));
    const n = (anim: string, i: number, r: Raster): void => {
      add('enemy_nastrond', anim, side, i, r, PIVOT_KING);
    };
    n('idle', 0, hollowAt(side, 0, 'rest', false));
    for (let i = 0; i < 4; i++) n('walk', i, hollowAt(side, i, 'rest', false));
    n('roar', 0, hollowAt(side, 0, 'raise', false));
    n('tell', 0, hollowAt(side, 0, 'raise', false));
    n('tell', 1, hollowAt(side, 1, 'raise', false));
    n('cut', 0, hollowAt(side, 0, 'cut', false));
    n('bare_idle', 0, hollowAt(side, 0, 'rest', true));
    for (let i = 0; i < 4; i++) n('bare_walk', i, hollowAt(side, i, 'rest', true));
    n('flail', 0, hollowAt(side, 0, 'flail', true));
    n('flail', 1, hollowAt(side, 2, 'flail', true));
  }
  out.push({
    name: 'enemy_tower_shield_idle_s_0',
    raster: outline(grid(TOWER_PAL, SHIELD_DOWN), INK, 1),
    pivot: { x: 0.5, y: 16 / 20 },
  });
  return out;
}
