import type { Dir4 } from '@core/math/dir';
import type { AnimDef } from '../anims';
import { rect } from '../draw';
import { C } from '../palette';
import { createRaster, flipX, hex, type Raster } from '../raster';
import { flipY, roundShield } from './haugar';
import { LOOKS, drawPerson, type Side } from './people';
import type { SpriteFrame } from './types';

/** The Act I finale: Styrr in his last duel, Bragð's beam, Hlíf's ward and the rime across the pass. */

const BLADE = hex(C.steel);
const BLADE_SHADE = hex(C.steelShade);

type DuelPose = 'rest' | 'raise' | 'cut' | 'wind' | 'heavy' | 'hurt';

/** Styrr with his round shield and sword (32×32, feet at 16, 30). */
function styrr(side: Side, phase: number, pose: DuelPose): Raster {
  const arms =
    pose === 'raise' || pose === 'wind' ? 'up' : pose === 'cut' || pose === 'heavy' ? 'forward' : 'down';
  const r = drawPerson(LOOKS.styrr, side, phase, { arms });
  const b = phase === 1 || phase === 3 ? 1 : 0;
  const hx = side === 'w' ? 12 : 23;
  if (pose === 'raise') {
    rect(r, hx, b + 2, 2, 12, BLADE);
    rect(r, hx + 1, b + 2, 1, 12, BLADE_SHADE);
  } else if (pose === 'wind') {
    // Both hands high, the blade laid back over the head: the heavy blow is coming.
    rect(r, 10, b + 2, 13, 2, BLADE);
    rect(r, 10, b + 3, 13, 1, BLADE_SHADE);
  } else if (pose === 'cut' || pose === 'heavy') {
    const w = pose === 'heavy' ? 3 : 2;
    if (side === 'w') rect(r, 2, b + 19, 10, w, BLADE);
    else if (side === 's') rect(r, 22, b + 20, w, 10 - b, BLADE);
    else rect(r, 22, b + 3, w, 11, BLADE);
  } else if (side !== 'n') rect(r, hx, b + 21, 2, 7, BLADE_SHADE);
  // The shield stays up, but not while both hands swing the heavy blow (nor when he reels).
  if (pose !== 'hurt' && pose !== 'wind' && pose !== 'heavy') {
    if (side === 's') roundShield(r, 11, b + 20, true);
    else if (side === 'w') roundShield(r, 9, b + 19, true);
    else roundShield(r, 16, b + 19, false);
  }
  return r;
}

const BEAM = hex('#e8f8ff');
const BEAM_EDGE = hex(C.rune);
const BEAM_DIM = hex('#4c8ea0');

/**
 * Bragð's beam flying east: a bright blade-shaped streak with a pale trail (20×10, its point at the
 * right). `i` shimmers the trail.
 */
function beamSide(i: number): Raster {
  const r = createRaster(20, 10);
  rect(r, 2 + i, 4, 4, 2, BEAM_DIM);
  rect(r, 6, 3, 8, 4, BEAM_EDGE);
  rect(r, 7, 4, 9, 2, BEAM);
  rect(r, 14, 3, 2, 4, BEAM_EDGE);
  rect(r, 16, 4, 2, 2, BEAM_EDGE);
  return r;
}

/** The beam flying north: the side streak turned on end (10×20, its point at the top). */
function beamUp(i: number): Raster {
  const side = beamSide(i);
  const r = createRaster(10, 20);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 10; x++) {
      const from = (x * 20 + (19 - y)) * 4;
      const to = (y * 10 + x) * 4;
      for (let k = 0; k < 4; k++) r.data[to + k] = side.data[from + k] ?? 0;
    }
  return r;
}

export function passFrames(): SpriteFrame[] {
  const frames: SpriteFrame[] = [];
  for (const side of ['s', 'n', 'w'] as const) {
    const add = (anim: string, i: number, raster: Raster): void => {
      frames.push({ name: `enemy_styrr_${anim}_${side}_${String(i)}`, raster, ox: 16, oy: 30 });
      if (side === 'w')
        frames.push({ name: `enemy_styrr_${anim}_e_${String(i)}`, raster: flipX(raster), ox: 16, oy: 30 });
    };
    add('idle', 0, styrr(side, 0, 'rest'));
    for (let i = 0; i < 4; i++) add('walk', i, styrr(side, i, 'rest'));
    add('tell', 0, styrr(side, 0, 'raise'));
    add('tell', 1, styrr(side, 1, 'raise'));
    add('cut', 0, styrr(side, 0, 'cut'));
    add('wind', 0, styrr(side, 0, 'wind'));
    add('wind', 1, styrr(side, 1, 'wind'));
    add('heavy', 0, styrr(side, 0, 'heavy'));
    add('hurt', 0, styrr(side, 2, 'hurt'));
  }
  for (let i = 0; i < 2; i++) {
    const side = beamSide(i);
    const up = beamUp(i);
    frames.push(
      { name: `fx_bragd_fly_e_${String(i)}`, raster: side, ox: 10, oy: 5 },
      { name: `fx_bragd_fly_w_${String(i)}`, raster: flipX(side), ox: 10, oy: 5 },
      { name: `fx_bragd_fly_n_${String(i)}`, raster: up, ox: 5, oy: 10 },
      { name: `fx_bragd_fly_s_${String(i)}`, raster: flipY(up), ox: 5, oy: 10 },
    );
  }
  return frames;
}

const ALL: readonly Dir4[] = ['s', 'n', 'w', 'e'];
const all = (frames: number, fps: number, loop = true): AnimDef => ({ frames, fps, loop, dirs: ALL });

export const PASS_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  fx_bragd: { fly: all(2, 12) },
  enemy_styrr: {
    idle: all(1, 1),
    walk: all(4, 5),
    tell: all(2, 6),
    cut: all(1, 1),
    wind: all(2, 4),
    heavy: all(1, 1),
    hurt: all(1, 1),
  },
};
