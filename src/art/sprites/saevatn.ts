import type { Dir4 } from '@core/math/dir';
import type { AnimDef } from '../anims';
import { ellipse } from '../draw';
import { C } from '../palette';
import { blit, createRaster, flipX, hex, setPixel, type Raster } from '../raster';
import { wolf, type WolfPal } from './enemies';
import type { Side } from './people';
import type { SpriteFrame } from './types';

/**
 * A ripple ring on open water: what marks a dive spot (a sunk chest or piece of heart). It swells over two
 * frames; once the spot is emptied only a faint ring is left.
 */
function ripple(r: number, faint: boolean): Raster {
  const out = createRaster(16, 16);
  const ring = hex(faint ? C.waterShade : C.waterLight);
  const shade = hex(C.waterShade);
  for (const [rad, c] of [
    [r, ring],
    [r - 2, faint ? ring : shade],
  ] as const) {
    for (let a = 0; a < 48; a++) {
      const t = (a / 48) * 2 * Math.PI;
      setPixel(out, Math.round(8 + rad * Math.cos(t)), Math.round(9 + rad * 0.6 * Math.sin(t)), c);
    }
  }
  if (!faint) setPixel(out, 8, 9, ring);
  return out;
}

/** The nykr foal (M7a): a small water horse, grey-green as lake water, with a mane of weed. */
const FOAL: WolfPal = {
  fur: hex('#5f7a72'),
  shade: hex('#3a4f4a'),
  light: hex('#8fb0a4'),
  eye: hex('#e8f8f0'),
  ruff: hex('#2f5a2a'),
};

/** The foal under the surface: a dark shape gliding under a widening ring. */
function foalUnder(phase: number): Raster {
  const r = createRaster(32, 32);
  ellipse(r, 16, 26, 7, 3, () => hex(C.waterShade));
  blit(r, ripple(5 + phase, false), 8, 14);
  return r;
}

/** Stranded on the bank: the foal on its side, legs thrashing. */
function foalFlounder(side: Side, phase: number): Raster {
  const r = createRaster(32, 32);
  blit(r, wolf(side, phase * 2, 'crouch', FOAL), 0, 0);
  return r;
}

export function saevatnFrames(): SpriteFrame[] {
  const at = (name: string, raster: Raster): SpriteFrame => ({ name, raster, ox: 8, oy: 14 });
  const foal: SpriteFrame[] = [];
  for (const side of ['s', 'n', 'w'] as const) {
    const add = (anim: string, i: number, raster: Raster): void => {
      foal.push({ name: `enemy_nykr_foal_${anim}_${side}_${String(i)}`, raster, ox: 16, oy: 30 });
      if (side === 'w')
        foal.push({ name: `enemy_nykr_foal_${anim}_e_${String(i)}`, raster: flipX(raster), ox: 16, oy: 30 });
    };
    add('under', 0, foalUnder(0));
    add('under', 1, foalUnder(1));
    add('idle', 0, wolf(side, 0, 'stand', FOAL));
    add('hurt', 0, wolf(side, 2, 'stand', FOAL));
    for (let i = 0; i < 4; i++) add('walk', i, wolf(side, i, 'stand', FOAL));
    add('tell', 0, wolf(side, 0, 'howl', FOAL));
    add('tell', 1, wolf(side, 2, 'howl', FOAL));
    add('lunge', 0, wolf(side, 0, 'lunge', FOAL));
    add('lunge', 1, wolf(side, 2, 'lunge', FOAL));
    add('flounder', 0, foalFlounder(side, 0));
    add('flounder', 1, foalFlounder(side, 1));
  }
  return [
    ...foal,
    at('fix_ripple_closed_s_0', ripple(4, false)),
    at('fix_ripple_closed_s_1', ripple(6, false)),
    at('fix_ripple_idle_s_0', ripple(4, false)),
    at('fix_ripple_idle_s_1', ripple(6, false)),
    at('fix_ripple_open_s_0', ripple(5, true)),
  ];
}

const one = (frames: number, fps: number): AnimDef => ({ frames, fps, loop: true, dirs: ['s'] });
const ALL: readonly Dir4[] = ['s', 'n', 'w', 'e'];
const all = (frames: number, fps: number): AnimDef => ({ frames, fps, loop: true, dirs: ALL });

export const SAEVATN_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  fix_ripple: { closed: one(2, 2), idle: one(2, 2), open: one(1, 1) },
  enemy_nykr_foal: {
    under: all(2, 3),
    idle: all(1, 1),
    hurt: all(1, 1),
    walk: all(4, 8),
    tell: all(2, 8),
    lunge: all(2, 10),
    flounder: all(2, 8),
  },
};
