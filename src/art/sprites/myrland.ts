import type { Dir4 } from '@core/math/dir';
import type { AnimDef } from '../anims';
import { ellipse, rect } from '../draw';
import { outline } from '../outline';
import { C } from '../palette';
import { createRaster, flipX, hex, type Raster } from '../raster';
import type { Side } from './people';
import type { SpriteFrame } from './types';

/** Mýrland's creatures: the water-worm in its pool, the bog-light over the fen, and the worm's spit. */

const INK = hex(C.ink);
const WATER = hex(C.water);
const WATER_LIGHT = hex(C.waterLight);
const WORM = hex('#4f6a3a');
const WORM_SHADE = hex('#34482a');
const WORM_BELLY = hex('#b9b27a');
const WORM_EYE = hex('#f2e05a');
const MAW = hex('#5a1f1f');
const MUD = hex(C.mud);
const MUD_SHADE = hex(C.mudShade);
const WISP = hex('#bfe8d8');
const WISP_CORE = hex('#ffffff');
const WISP_HALO = hex('#5fb89a');

// ── Water-worm: 32×32, its ripple (the feet) at (16, 28) ──────────────────────────────────────────────

type WormPose = 'under' | 'rear' | 'up' | 'sink';

/** Rings on the water where it lies; `wide` when it is about to break the surface. */
function ripple(r: Raster, wide: boolean): void {
  ellipse(r, 16, 27, wide ? 9 : 7, wide ? 3 : 2.5, WATER_LIGHT);
  ellipse(r, 16, 27, wide ? 7 : 5, wide ? 2 : 1.5, WATER);
}

function worm(side: Side, pose: WormPose): Raster {
  const r = createRaster(32, 32);
  ripple(r, pose !== 'up');
  if (pose === 'under') {
    // Only its back, a dark hump breaking the rings.
    ellipse(r, 16, 26, 3, 1.5, WORM_SHADE);
    return r;
  }
  const top = pose === 'rear' ? 6 : pose === 'up' ? 9 : 16;
  // The neck: a thick coil rising out of the water, belly toward the viewer.
  for (let y = top + 5; y < 27; y++) {
    const sway = side === 'w' ? Math.round((27 - y) / 6) * -1 : 0;
    rect(r, 13 + sway, y, 6, 1, WORM);
    rect(r, 17 + sway, y, 2, 1, WORM_SHADE);
    if (side === 's') rect(r, 15 + sway, y, 2, 1, WORM_BELLY);
  }
  // The head.
  const hx = side === 'w' ? 12 : 16;
  ellipse(r, hx, top + 3, 5, 4, (_x, y) => (y > top + 4 ? WORM_SHADE : WORM));
  if (side !== 'n') {
    rect(r, hx - (side === 'w' ? 4 : 3), top + 1, 2, 2, WORM_EYE);
    if (side === 's') rect(r, hx + 2, top + 1, 2, 2, WORM_EYE);
    // The maw gapes on the tell and as it spits.
    if (pose !== 'sink') rect(r, hx - (side === 'w' ? 5 : 2), top + 4, 4, pose === 'rear' ? 3 : 2, MAW);
  }
  return outline(r, INK, 2);
}

// ── Bog-light: 24×32, a flame hanging over its reflection (the feet) at (12, 30) ─────────────────────

type WispPose = 'a' | 'b' | 'faded' | 'flare' | 'dart';

function wisp(pose: WispPose): Raster {
  const r = createRaster(24, 32);
  ellipse(r, 12, 29, 3, 1, WISP_HALO);
  if (pose === 'faded') {
    // Barely a shimmer.
    ellipse(r, 12, 14, 2, 3, WISP_HALO);
    return r;
  }
  const big = pose === 'flare' ? 1.6 : pose === 'dart' ? 1.2 : 1;
  const bob = pose === 'b' ? 1 : 0;
  ellipse(r, 12, 14 + bob, 5 * big, 7 * big, WISP_HALO);
  ellipse(r, 12, 15 + bob, 3.5 * big, 5 * big, WISP);
  ellipse(r, 12, 16 + bob, 1.6 * big, 2.5 * big, WISP_CORE);
  // A licking tip.
  rect(r, 12 - bob, 5 + bob - Math.round(big * 2), 1, 3, WISP);
  return r;
}

// ── Spit: a gob of mud, 10×12, its shadow (the feet) at (5, 10) ───────────────────────────────────────

function spit(i: number): Raster {
  const r = createRaster(10, 12);
  ellipse(r, 5, 10, 2.5, 1, MUD_SHADE);
  ellipse(r, 5, 3 + (i % 2), 3, 2.5 + (i % 2) * 0.5, MUD);
  rect(r, 4, 2 + (i % 2), 1, 1, hex(C.mudLight));
  return outline(r, INK, 1);
}

export function myrlandFrames(): SpriteFrame[] {
  const out: SpriteFrame[] = [];
  const add = (art: string, anim: string, side: Side, i: number, raster: Raster, ox: number, oy: number) => {
    out.push({ name: `${art}_${anim}_${side}_${i}`, raster, ox, oy });
    if (side === 'w')
      out.push({ name: `${art}_${anim}_e_${i}`, raster: flipX(raster), ox: raster.w - ox, oy });
  };
  for (const side of ['s', 'n', 'w'] as const) {
    const w = (anim: string, i: number, r: Raster): void => {
      add('enemy_vatnormr', anim, side, i, r, 16, 28);
    };
    w('under', 0, worm(side, 'under'));
    w('tell', 0, worm(side, 'rear'));
    w('up', 0, worm(side, 'up'));
    w('sink', 0, worm(side, 'sink'));
    w('hurt', 0, worm(side, 'up'));
    const l = (anim: string, i: number, r: Raster): void => {
      add('enemy_myrljos', anim, side, i, r, 12, 30);
    };
    l('fly', 0, wisp('a'));
    l('fly', 1, wisp('b'));
    l('fade', 0, wisp('faded'));
    l('tell', 0, wisp('flare'));
    l('tell', 1, wisp('a'));
    l('dart', 0, wisp('dart'));
    l('hurt', 0, wisp('faded'));
  }
  for (let i = 0; i < 2; i++) out.push({ name: `fx_spit_fly_s_${i}`, raster: spit(i), ox: 5, oy: 10 });
  return out;
}

const ALL: readonly Dir4[] = ['s', 'n', 'w', 'e'];
const a = (frames: number, fps: number, loop = true): AnimDef => ({ frames, fps, loop, dirs: ALL });

export const MYRLAND_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  enemy_vatnormr: { under: a(1, 1), tell: a(1, 1), up: a(1, 1), sink: a(1, 1), hurt: a(1, 1) },
  enemy_myrljos: { fly: a(2, 4), fade: a(1, 1), tell: a(2, 12), dart: a(1, 1), hurt: a(1, 1) },
  fx_spit: { fly: { frames: 2, fps: 10, loop: true, dirs: ['s'] } },
};
