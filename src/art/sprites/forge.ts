import type { Dir4 } from '@core/math/dir';
import type { AnimDef } from '../anims';
import { ellipse, rect } from '../draw';
import { outline } from '../outline';
import { C } from '../palette';
import { createRaster, flipX, getPixel, hex, setPixel, type Raster, type Rgba } from '../raster';
import type { SpriteFrame } from './types';

/** Dvergagröf and Ívaldi's Forge (M8): the iron warden and the ember sprite. */

const INK = hex(C.ink);
const IRON = hex('#4a4a54');
const IRON_LIGHT = hex('#7a7a88');
const IRON_DARK = hex('#2a2a32');
const RIVET = hex('#a8a090');
const GLOW = hex('#f08a2c');
const GLOW_HOT = hex('#f8d04a');
const EMBER_HALO: Rgba = [240, 120, 40, 120];
const EMBER: Rgba = [244, 150, 52, 230];
const EMBER_CORE: Rgba = [252, 222, 120, 255];

type WardenPose = 'idle' | 'step' | 'tell' | 'swing' | 'hurt';

/**
 * The iron warden, 32×36 with its feet at (16, 34): a squat plated body on stumpy legs, a slit of forge
 * light for a face, fists like anvils. `side` draws it in profile; `sink` lowers it into the ground as it
 * wakes (the rise).
 */
function warden(side: 's' | 'n' | 'w', pose: WardenPose, phase: number, sink = 0): Raster {
  const r = createRaster(32, 36);
  const b = phase === 1 || phase === 3 ? 1 : 0;
  const legL = pose === 'step' && phase % 2 === 0 ? -1 : 0;
  // Legs.
  rect(r, 10, 26 + b + legL, 5, 8 - b - legL, IRON_DARK);
  rect(r, 17, 26 + b - legL, 5, 8 - b + legL, IRON_DARK);
  // The plated trunk.
  rect(r, 7, 12 + b, 18, 15, IRON);
  rect(r, 7, 12 + b, 18, 2, IRON_LIGHT);
  rect(r, 7, 24 + b, 18, 3, IRON_DARK);
  for (const x of [9, 22]) for (const y of [15, 21]) rect(r, x, y + b, 1, 1, RIVET);
  // The head, sunk between the shoulders, with its slit of light.
  rect(r, 11, 5 + b, 10, 8, IRON);
  rect(r, 11, 5 + b, 10, 1, IRON_LIGHT);
  if (side !== 'n') {
    const eye = pose === 'tell' ? GLOW_HOT : GLOW;
    if (side === 's') rect(r, 13, 8 + b, 6, 2, eye);
    else rect(r, 11, 8 + b, 4, 2, eye);
  }
  // Fists: down, raised for the tell, slammed for the swing.
  const fistY = pose === 'tell' ? 3 + b : pose === 'swing' ? 22 + b : 18 + b;
  if (side === 'w') {
    rect(r, 3, fistY, 7, 7, IRON_DARK);
    rect(r, 3, fistY, 7, 1, IRON_LIGHT);
  } else {
    rect(r, 2, fistY, 6, 7, IRON_DARK);
    rect(r, 24, fistY, 6, 7, IRON_DARK);
    rect(r, 2, fistY, 6, 1, IRON_LIGHT);
    rect(r, 24, fistY, 6, 1, IRON_LIGHT);
  }
  if (pose === 'hurt') rect(r, 13, 15 + b, 6, 1, GLOW_HOT);
  return outline(sunkBy(r, sink), INK, 1);
}

/** Lowers a figure `sink` px into the ground: what goes below its feet (row 33) is gone. */
function sunkBy(src: Raster, sink: number): Raster {
  if (sink === 0) return src;
  const r = createRaster(src.w, src.h);
  for (let y = 0; y + sink <= 33; y++)
    for (let x = 0; x < src.w; x++) setPixel(r, x, y + sink, getPixel(src, x, y));
  return r;
}

type EmberPose = 'a' | 'b' | 'faded' | 'flare' | 'dart';

/** The ember sprite, 24×32 with its shadow (the feet) at (12, 30): a spitting coal with a halo. */
function ember(pose: EmberPose): Raster {
  const r = createRaster(24, 32);
  ellipse(r, 12, 29, 3, 1, EMBER_HALO);
  if (pose === 'faded') {
    ellipse(r, 12, 14, 2, 2, EMBER_HALO);
    return r;
  }
  const big = pose === 'flare' ? 1.6 : pose === 'dart' ? 1.2 : 1;
  const bob = pose === 'b' ? 1 : 0;
  ellipse(r, 12, 14 + bob, 5 * big, 5 * big, EMBER_HALO);
  ellipse(r, 12, 14 + bob, 3.5 * big, 3.5 * big, EMBER);
  ellipse(r, 12, 14 + bob, 1.6 * big, 1.6 * big, EMBER_CORE);
  // Sparks thrown off it.
  rect(r, 6 + bob * 2, 8, 1, 1, EMBER_CORE);
  rect(r, 17 - bob * 2, 10, 1, 1, EMBER_CORE);
  return r;
}

export function forgeFrames(): SpriteFrame[] {
  const out: SpriteFrame[] = [];
  const add = (
    art: string,
    anim: string,
    side: 's' | 'n' | 'w',
    i: number,
    raster: Raster,
    ox: number,
    oy: number,
  ) => {
    out.push({ name: `${art}_${anim}_${side}_${String(i)}`, raster, ox, oy });
    if (side === 'w')
      out.push({ name: `${art}_${anim}_e_${String(i)}`, raster: flipX(raster), ox: raster.w - ox, oy });
  };
  for (const side of ['s', 'n', 'w'] as const) {
    const w = (anim: string, i: number, r: Raster): void => {
      add('enemy_jarnvordr', anim, side, i, r, 16, 34);
    };
    [12, 8, 4, 0].forEach((sink, i) => {
      w('rise', i, warden(side, 'idle', 0, sink));
    });
    w('idle', 0, warden(side, 'idle', 0));
    for (let i = 0; i < 4; i++) w('walk', i, warden(side, 'step', i));
    w('tell', 0, warden(side, 'tell', 0));
    w('tell', 1, warden(side, 'tell', 1));
    w('swing', 0, warden(side, 'swing', 0));
    w('swing', 1, warden(side, 'swing', 2));
    w('hurt', 0, warden(side, 'hurt', 0));
    const g = (anim: string, i: number, r: Raster): void => {
      add('enemy_glod', anim, side, i, r, 12, 30);
    };
    g('idle', 0, ember('a'));
    g('fly', 0, ember('a'));
    g('fly', 1, ember('b'));
    g('fade', 0, ember('faded'));
    g('tell', 0, ember('flare'));
    g('tell', 1, ember('a'));
    g('dart', 0, ember('dart'));
    g('hurt', 0, ember('faded'));
  }
  return out;
}

const ALL: readonly Dir4[] = ['s', 'n', 'w', 'e'];
const a = (frames: number, fps: number, loop = true): AnimDef => ({ frames, fps, loop, dirs: ALL });

export const FORGE_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  enemy_jarnvordr: {
    idle: a(1, 1),
    hurt: a(1, 1),
    walk: a(4, 4),
    rise: a(4, 6, false),
    tell: a(2, 6),
    swing: a(2, 12, false),
  },
  enemy_glod: { idle: a(1, 1), fly: a(2, 6), fade: a(1, 1), tell: a(2, 12), dart: a(1, 1), hurt: a(1, 1) },
};
