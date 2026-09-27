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

const AMBER = hex(C.sap);
const AMBER_LIGHT = hex(C.sapLight);
const AMBER_SHADE = hex(C.sapShade);
const EYE = hex('#f2d45c');
const MAW = hex('#2a1614');
const FANG = hex('#efe6cc');
const WOOD = hex(C.wood);
const WOOD_SHADE = hex(C.woodShade);
const CRACK = hex('#2e2420');

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

// ── Root-biter: a root with a mouth, 28×32, feet at (14, 28) ──────────────────────────────────────────

/** How far the stalk stands out of the ground (0 buried … 1 up), whether it gapes, and a sideways lean. */
function biter(rise: number, gape: boolean, lean = 0): Raster {
  const r = createRaster(28, 32);
  const ground = 27;
  // Torn earth around the hole.
  ellipse(r, 14, ground, 9, 2.5, ROOT_SHADE);
  rect(r, 7, ground - 1, 2, 1, ROOT);
  rect(r, 19, ground, 2, 1, ROOT);
  if (rise <= 0) {
    // Buried: only a knot of root and a slit eye show.
    ellipse(r, 14, ground - 2, 5, 3, ROOT);
    rect(r, 12, ground - 3, 4, 1, ROOT_LIGHT);
    rect(r, 15, ground - 2, 1, 1, EYE);
    return outline(r, INK, 1);
  }
  const h = Math.round(20 * rise);
  const top = ground - h;
  for (let y = top + 6; y < ground; y++) {
    const x = 11 + Math.round((lean * (ground - y)) / 20);
    rect(r, x, y, 6, 1, ROOT);
    rect(r, x + 4, y, 2, 1, ROOT_SHADE);
  }
  const hx = 14 + lean;
  if (gape) {
    ellipse(r, hx, top + 4, 7, 5.5, ROOT);
    ellipse(r, hx, top + 5, 5, 3.5, MAW);
    for (const x of [-3, 0, 3]) {
      rect(r, hx + x, top + 2, 1, 2, FANG);
      rect(r, hx + x, top + 7, 1, 2, FANG);
    }
  } else {
    ellipse(r, hx, top + 4, 6, 4.5, ROOT);
    rect(r, hx - 4, top + 5, 8, 1, MAW);
    rect(r, hx - 2, top + 6, 1, 1, FANG);
    rect(r, hx + 2, top + 6, 1, 1, FANG);
  }
  rect(r, hx - 3, top + 1, 2, 1, ROOT_LIGHT);
  rect(r, hx + 2, top + 2, 1, 1, EYE);
  return outline(r, INK, 1);
}

// ── Rótvættr: a heart of roots, 56×52, feet at (28, 49) ────────────────────────────────────────────────

type Heart = 'shut' | 'open' | 'roar';

function rotvaettr(state: Heart, shake: number): Raster {
  const r = createRaster(56, 52);
  const cx = 28 + shake;
  // Roots spreading into the floor.
  for (const [x0, x1] of [
    [cx - 6, 4],
    [cx + 6, 51],
    [cx - 2, 12],
    [cx + 2, 44],
  ] as const) {
    line(r, x0, 42, x1, 48, ROOT_SHADE);
    line(r, x0, 41, x1, 47, ROOT);
  }
  ellipse(r, cx, 26, 18, 19, ROOT_SHADE);
  ellipse(r, cx - 2, 24, 15, 16, ROOT);
  if (state === 'shut') {
    // The bark shell closed over the heart: a seam and a sleeping eye.
    rect(r, cx - 1, 10, 2, 30, ROOT_SHADE);
    rect(r, cx - 6, 20, 4, 1, INK);
    rect(r, cx + 3, 20, 4, 1, INK);
  } else {
    // The shell peeled apart on a glowing amber heart.
    ellipse(r, cx, 27, 9, 11, MAW);
    ellipse(r, cx, 28, 6.5, 8, AMBER);
    ellipse(r, cx - 1, 26, 3.5, 4.5, AMBER_LIGHT);
    rect(r, cx - 7, 18, 3, 3, EYE);
    rect(r, cx + 5, 18, 3, 3, EYE);
    if (state === 'roar') {
      rect(r, cx - 5, 38, 11, 3, MAW);
      for (const x of [-4, -1, 2]) rect(r, cx + x, 38, 1, 2, FANG);
    }
  }
  for (const [x, y] of [
    [cx - 12, 14],
    [cx + 9, 32],
    [cx - 10, 34],
  ] as const)
    line(r, x, y, x + 5, y - 4, ROOT_LIGHT);
  return outline(r, INK, 1);
}

// ── A bulb on its stalk, 20×24, feet at (10, 21) ────────────────────────────────────────────────────────

function bulb(pulse: number): Raster {
  const r = createRaster(20, 24);
  rect(r, 9, 12, 3, 9, ROOT);
  rect(r, 11, 12, 1, 9, ROOT_SHADE);
  ellipse(r, 10, 20, 5, 1.5, ROOT_SHADE);
  const g = 5 + pulse * 0.5;
  ellipse(r, 10, 8, g, g, AMBER_SHADE);
  ellipse(r, 10, 8, g - 1.5, g - 1.5, AMBER);
  ellipse(r, 9, 7, 1.8, 1.8, AMBER_LIGHT);
  return outline(r, INK, 1);
}

// ── A root spike, 20×32, feet at (10, 29) ───────────────────────────────────────────────────────────────

function crack(i: number): Raster {
  const r = createRaster(20, 32);
  // Heaved earth, split open.
  ellipse(r, 10, 27, 8, 2.6, ROOT_SHADE);
  ellipse(r, 10, 27, 4, 1.2, CRACK);
  line(r, 4, 28, 16, 27, CRACK);
  line(r, 9, 25, 11, 29, CRACK);
  if (i === 1) {
    line(r, 3, 26, 7, 29, CRACK);
    line(r, 13, 29, 17, 25, CRACK);
    rect(r, 9, 27, 2, 1, ROOT);
  }
  return r;
}

function spike(h: number): Raster {
  const r = createRaster(20, 32);
  const base = 28;
  for (let y = 0; y < h; y++) {
    const w = Math.max(1, Math.round((6 * (h - y)) / h));
    rect(r, 10 - Math.floor(w / 2), base - y, w, 1, y > h - 3 ? ROOT_LIGHT : ROOT);
    rect(r, 10 + Math.ceil(w / 2) - 1, base - y, 1, 1, ROOT_SHADE);
  }
  ellipse(r, 10, base, 6, 1.5, CRACK);
  return outline(r, INK, 1);
}

// ── The boomerang in flight, 14×14, drawn on its ground point ────────────────────────────────────────

function boomerang(turn: number): Raster {
  const r = createRaster(14, 14);
  // An L of bent wood, turned a quarter each frame.
  const arms: readonly (readonly [number, number, number, number])[] = [
    [3, 3, 8, 3],
    [8, 3, 3, 8],
    [3, 8, 8, 3],
    [3, 3, 3, 8],
  ];
  const [x, y, w, h] = arms[turn] ?? [3, 3, 8, 3];
  const [x2, y2, w2, h2] = arms[(turn + 3) % 4] ?? [3, 3, 3, 8];
  rect(r, x, y, w, h, WOOD);
  rect(r, x2, y2, w2, h2, WOOD);
  rect(r, x + w - 1, y + h - 1, 1, 1, WOOD_SHADE);
  return outline(r, INK, 1);
}

export function caveFrames(): SpriteFrame[] {
  const out: SpriteFrame[] = [
    propFrame('prop_root_block_idle_s_0', rootBlock()),
    propFrame('prop_vines_idle_s_0', vines()),
  ];
  const b = (anim: string, i: number, raster: Raster): void => {
    out.push({ name: `enemy_root_biter_${anim}_s_${i}`, raster, ox: 14, oy: 28 });
  };
  b('buried', 0, biter(0, false));
  b('tell', 0, biter(0.45, false, -1));
  b('tell', 1, biter(0.55, false, 1));
  b('bite', 0, biter(1, true));
  b('bite', 1, biter(0.9, true));
  b('idle', 0, biter(1, false));
  b('hurt', 0, biter(0.85, false, 2));
  b('retract', 0, biter(0.6, false));
  b('retract', 1, biter(0.25, false));
  const v = (anim: string, i: number, raster: Raster): void => {
    out.push({ name: `enemy_rotvaettr_${anim}_s_${i}`, raster, ox: 28, oy: 49 });
  };
  v('idle', 0, rotvaettr('shut', 0));
  v('open', 0, rotvaettr('open', 0));
  v('open', 1, rotvaettr('open', 0));
  v('roar', 0, rotvaettr('roar', -1));
  v('roar', 1, rotvaettr('roar', 1));
  for (let i = 0; i < 2; i++)
    out.push({ name: `enemy_rot_bulb_idle_s_${i}`, raster: bulb(i), ox: 10, oy: 21 });
  const sp = (anim: string, i: number, raster: Raster): void => {
    out.push({ name: `enemy_root_spike_${anim}_s_${i}`, raster, ox: 10, oy: 29 });
  };
  sp('tell', 0, crack(0));
  sp('tell', 1, crack(1));
  sp('erupt', 0, spike(18));
  sp('erupt', 1, spike(22));
  sp('sink', 0, spike(10));
  for (let i = 0; i < 4; i++)
    out.push({ name: `fx_boomerang_spin_s_${i}`, raster: boomerang(i), ox: 7, oy: 10 });
  return out;
}

const ONE: AnimDef = { frames: 1, fps: 1, loop: true, dirs: ['s'] };

const S = (frames: number, fps: number, loop = true): AnimDef => ({ frames, fps, loop, dirs: ['s'] });

export const CAVE_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  prop_root_block: { idle: ONE },
  prop_vines: { idle: ONE },
  enemy_root_biter: {
    buried: ONE,
    tell: S(2, 10),
    bite: S(2, 12, false),
    idle: ONE,
    hurt: ONE,
    retract: S(2, 10, false),
  },
  enemy_rotvaettr: { idle: ONE, open: S(2, 3), roar: S(2, 12) },
  enemy_rot_bulb: { idle: S(2, 3) },
  enemy_root_spike: { tell: S(2, 8), erupt: S(2, 12, false), sink: ONE },
  fx_boomerang: { spin: S(4, 16) },
};
