import type { Dir4 } from '@core/math/dir';
import type { AnimDef } from '../anims';
import { ellipse, line, rect } from '../draw';
import { outline } from '../outline';
import { C } from '../palette';
import { createRaster, flipX, hex, type Raster } from '../raster';
import type { SpriteFrame } from './types';

/** Bombs and what they open (the bomb and the bomb pot, cracked walls and rock piles), and the mud-crab. */

const INK = hex(C.ink);
const IRON = hex('#3b3f47');
const IRON_SHADE = hex('#24272d');
const IRON_LIGHT = hex('#7d8490');
const FUSE = hex(C.straw);
const SPARK = hex('#fff2a8');
const FLASH = hex('#e0503a');
const FLASH_LIGHT = hex('#ffb0a0');
const CLAY = hex(C.clay);
const CLAY_SHADE = hex(C.clayShade);
const ROCK = hex(C.rock);
const ROCK_SHADE = hex(C.rockShade);
const ROCK_LIGHT = hex(C.rockLight);
const WALL = hex(C.caveWall);
const WALL_LIGHT = hex(C.caveWallLight);
const DARK = hex('#161214');
const WHEEL = hex(C.wood);
const WHEEL_SHADE = hex(C.woodShade);

// ── The bomb: 14×16, its feet at (7, 15) ─────────────────────────────────────────────────────────────

type BombPose = 'rest' | 'spark' | 'flash';

function bomb(pose: BombPose): Raster {
  const r = createRaster(14, 16);
  const red = pose === 'flash';
  ellipse(r, 7, 9.5, 4.5, 4.5, (x, y) => (x + y > 18 ? (red ? FLASH : IRON_SHADE) : red ? FLASH : IRON));
  rect(r, 5, 7, 2, 2, red ? FLASH_LIGHT : IRON_LIGHT);
  // The collar and the fuse, curling up to the right.
  rect(r, 6, 4, 3, 2, IRON_SHADE);
  line(r, 8, 3, 10, 2, FUSE);
  if (pose === 'spark') {
    rect(r, 10, 1, 2, 1, SPARK);
    rect(r, 11, 2, 1, 1, SPARK);
  } else rect(r, 10, 1, 1, 1, SPARK);
  return outline(r, INK, 1);
}

/** A clay pot stoppered with wax and marked with a black band: bombs inside. */
function bombPot(): Raster {
  const r = createRaster(16, 14);
  ellipse(r, 8, 8, 6, 4.5, (x) => (x > 10 ? CLAY_SHADE : CLAY));
  rect(r, 5, 2, 6, 2, CLAY_SHADE);
  rect(r, 6, 1, 4, 1, IRON);
  rect(r, 2, 7, 12, 2, IRON_SHADE);
  rect(r, 7, 7, 2, 2, SPARK);
  return outline(r, INK, 1);
}

// ── Cracks, one tile each (18 px wide, feet 2 px above the bottom, like every fixture) ───────────────

const TILE_H = 18;

/** A zigzag split across a tile. */
function split(r: Raster, x: number, c: typeof INK): void {
  line(r, x, 2, x + 2, 6, c);
  line(r, x + 2, 6, x - 1, 10, c);
  line(r, x - 1, 10, x + 3, 15, c);
  line(r, x + 2, 6, x + 6, 8, c);
}

/** A stretch of wall with a crack running through it. */
function crackedWall(): Raster {
  const r = createRaster(18, TILE_H);
  rect(r, 1, 1, 16, 16, WALL);
  rect(r, 1, 1, 16, 2, WALL_LIGHT);
  for (const y of [6, 11]) rect(r, 1, y, 16, 1, ROCK_SHADE);
  split(r, 7, DARK);
  return r;
}

/** The same wall blown through: a dark hole with a lip of rubble. */
function blownWall(): Raster {
  const r = createRaster(18, TILE_H);
  rect(r, 1, 1, 16, 16, DARK);
  rect(r, 1, 1, 16, 3, WALL);
  rect(r, 1, 1, 2, 16, WALL);
  rect(r, 15, 1, 2, 16, WALL);
  for (const [x, y] of [
    [3, 14],
    [7, 15],
    [11, 14],
  ] as const)
    ellipse(r, x + 1, y, 1.5, 1, ROCK_SHADE);
  return r;
}

/** A heap of boulders with one split through. */
function crackedRock(): Raster {
  const r = createRaster(18, TILE_H);
  ellipse(r, 9, 9.5, 7.5, 7, (x, y) => (x + y > 20 ? ROCK_SHADE : ROCK));
  ellipse(r, 6, 6, 2.5, 2, ROCK_LIGHT);
  split(r, 9, DARK);
  return outline(r, INK, 1);
}

/** Its rubble: a few stones left on the ground. */
function rubble(): Raster {
  const r = createRaster(18, TILE_H);
  ellipse(r, 5, 14, 2.5, 1.5, ROCK_SHADE);
  ellipse(r, 11, 14.5, 2, 1.5, ROCK);
  ellipse(r, 14, 12.5, 1.5, 1, ROCK_SHADE);
  return outline(r, INK, 1);
}

// ── Mud-crab: 32×24, its feet at (16, 21) ─────────────────────────────────────────────────────────────

const SHELL = hex('#6d5a3c');
const SHELL_SHADE = hex('#4a3c28');
const SHELL_LIGHT = hex('#8f7a52');
const CLAW = hex('#8a4a32');
const CLAW_SHADE = hex('#5e3222');
const EYE = hex('#e8e0b0');

type CrabPose = 'rest' | 'step' | 'raise' | 'snap' | 'hurt';

function crab(side: 'front' | 'back' | 'side', pose: CrabPose): Raster {
  const r = createRaster(32, 24);
  const lift = pose === 'hurt' ? 1 : 0;
  // Legs: three a side, scuttling on the step.
  for (let k = 0; k < 3; k++) {
    const y = 16 + k * 2;
    const out = pose === 'step' && k % 2 === 0 ? 1 : 0;
    line(r, 9, y - 2, 4 - out, y + 1, SHELL_SHADE);
    line(r, 22, y - 2, 27 + out, y + 1, SHELL_SHADE);
  }
  // The shell: a broad, low dome of dried mud.
  ellipse(r, 16, 15 + lift, 8, 5.5, (x, y) => (y > 16 + lift ? SHELL_SHADE : x < 13 ? SHELL_LIGHT : SHELL));
  rect(r, 12, 12 + lift, 8, 1, SHELL_SHADE);
  // The claws: held low, raised on the tell, thrust forward on the pinch.
  const cy = pose === 'raise' ? 6 : pose === 'snap' ? 15 : 12;
  const cx = pose === 'snap' ? 5 : 6;
  for (const [x, flip] of [
    [cx, false],
    [31 - cx, true],
  ] as const) {
    ellipse(r, x, cy, 3, 2.5, CLAW);
    rect(r, flip ? x - 2 : x, cy + 1, 3, 1, CLAW_SHADE);
    line(r, flip ? x - 2 : x + 2, cy + 3, flip ? 22 : 9, 15, CLAW_SHADE);
  }
  if (side !== 'back') {
    rect(r, 13, 9 + lift, 1, 3, SHELL_SHADE);
    rect(r, 18, 9 + lift, 1, 3, SHELL_SHADE);
    rect(r, 13, 8 + lift, 1, 1, EYE);
    rect(r, 18, 8 + lift, 1, 1, EYE);
  }
  return outline(r, INK, 1);
}

/** A mill wheel on its axle, one tile: paddles upright when turned to the water's level, askew when not. */
function wheel(on: boolean): Raster {
  const r = createRaster(18, 26);
  ellipse(r, 9, 13, 7.5, 7.5, WHEEL_SHADE);
  ellipse(r, 9, 13, 5.5, 5.5, WHEEL);
  const spokes: readonly (readonly [number, number])[] = on
    ? [
        [0, -7],
        [7, 0],
        [0, 7],
        [-7, 0],
      ]
    : [
        [5, -5],
        [5, 5],
        [-5, 5],
        [-5, -5],
      ];
  for (const [dx, dy] of spokes) line(r, 9, 13, 9 + dx, 13 + dy, WHEEL_SHADE);
  ellipse(r, 9, 13, 1.5, 1.5, IRON);
  rect(r, 7, 20, 4, 4, ROCK_SHADE);
  if (on) rect(r, 8, 12, 2, 2, SPARK);
  return outline(r, INK, 1);
}

const DOOR_H = 26;
const GOLD = hex(C.shieldRim);

/** The boss door: iron-bound oak with a great padlock, or its threshold once open. */
function bigLock(open: boolean): Raster {
  const r = createRaster(18, DOOR_H);
  if (open) {
    rect(r, 1, DOOR_H - 7, 16, 4, WHEEL);
    rect(r, 1, DOOR_H - 4, 16, 1, WHEEL_SHADE);
    return outline(r, INK, 1);
  }
  rect(r, 1, 3, 16, DOOR_H - 5, WHEEL_SHADE);
  for (const x of [4, 8, 12]) rect(r, x, 3, 2, DOOR_H - 5, WHEEL);
  for (const y of [5, 12, DOOR_H - 7]) rect(r, 1, y, 16, 2, IRON);
  ellipse(r, 9, 9, 3, 3, IRON_SHADE);
  rect(r, 5, 11, 8, 7, GOLD);
  rect(r, 8, 13, 2, 3, INK);
  return outline(r, INK, 1);
}

// ── Lindormr: 48×48, its feet at (24, 44); and its mud mounds, 28×24, feet at (14, 21) ──────────────

const SCALE = hex('#3f5a44');
const SCALE_SHADE = hex('#2a3d2e');
const SCALE_LIGHT = hex('#6f8f5a');
const BELLY = hex('#c9b98a');
const FANG = hex('#f0ead0');
const MUD = hex(C.mud);
const MUD_SHADE = hex(C.mudShade);
const MUD_LIGHT = hex(C.mudLight);

type WormPose = 'hidden' | 'tell' | 'rear' | 'roar' | 'ripple' | 'dazed' | 'coil' | 'charge' | 'burrow';

/** Mud rings round where it breaks the surface. */
function mudRing(r: Raster, wide: number): void {
  ellipse(r, 24, 42, wide, 3, MUD_SHADE);
  ellipse(r, 24, 42, wide - 3, 2, MUD);
}

function serpent(side: 'front' | 'back' | 'side', pose: WormPose): Raster {
  const r = createRaster(48, 48);
  if (pose === 'hidden') {
    ellipse(r, 20, 40, 1.5, 1.5, MUD_LIGHT);
    ellipse(r, 27, 42, 1, 1, MUD_LIGHT);
    return outline(r, INK, 1);
  }
  if (pose === 'ripple') {
    mudRing(r, 14);
    ellipse(r, 24, 42, 7, 1.5, MUD_LIGHT);
    return outline(r, INK, 1);
  }
  const lying = pose === 'dazed' || pose === 'charge';
  if (pose === 'coil') {
    mudRing(r, 16);
    ellipse(r, 24, 36, 14, 7, SCALE_SHADE);
    ellipse(r, 24, 34, 11, 5, SCALE);
    ellipse(r, 24, 30, 7, 4, SCALE_LIGHT);
  } else if (lying) {
    // Stretched along the ground, the head forward.
    ellipse(r, 22, 39, 18, 4, SCALE_SHADE);
    ellipse(r, 22, 37, 16, 3, SCALE);
  } else {
    mudRing(r, pose === 'burrow' ? 16 : 13);
    const top = pose === 'tell' ? 20 : pose === 'burrow' ? 30 : 10;
    for (let y = top + 8; y < 42; y++) {
      const sway = Math.round(Math.sin((y - top) / 5) * 2);
      rect(r, 19 + sway, y, 10, 1, SCALE);
      rect(r, 26 + sway, y, 3, 1, SCALE_SHADE);
      if (side === 'front') rect(r, 22 + sway, y, 4, 1, BELLY);
    }
  }
  // The head.
  const hx = lying ? 38 : 24;
  const hy = lying ? 35 : pose === 'coil' ? 24 : pose === 'tell' ? 20 : pose === 'burrow' ? 30 : 10;
  ellipse(r, hx, hy + 3, 7, 5, (_x, y) => (y > hy + 5 ? SCALE_SHADE : SCALE));
  if (side !== 'back') {
    const eye = pose === 'dazed' ? SCALE_SHADE : hex('#e8d24a');
    rect(r, hx - 4, hy + 1, 2, 2, eye);
    rect(r, hx + 2, hy + 1, 2, 2, eye);
    if (pose === 'rear' || pose === 'roar' || pose === 'charge') {
      const gape = pose === 'roar' ? 4 : 2;
      rect(r, hx - 3, hy + 5, 6, gape, hex('#5a1f1f'));
      rect(r, hx - 3, hy + 5, 1, 2, FANG);
      rect(r, hx + 2, hy + 5, 1, 2, FANG);
    }
  }
  if (pose === 'dazed')
    for (const [x, y] of [
      [hx - 6, hy - 4],
      [hx + 5, hy - 5],
    ] as const)
      rect(r, x, y, 2, 2, SPARK);
  return outline(r, INK, 1);
}

/** A mound of grey mud; bubbling while the serpent hides in it. */
function mound(bubble: number | null): Raster {
  const r = createRaster(28, 24);
  ellipse(r, 14, 15, 11, 6.5, (_x, y) => (y > 16 ? MUD_SHADE : MUD));
  ellipse(r, 11, 12, 4, 2, MUD_LIGHT);
  if (bubble !== null) {
    ellipse(r, 10 + bubble * 5, 9 - bubble, 2, 2, MUD_LIGHT);
    rect(r, 16 - bubble * 3, 8 + bubble, 2, 2, MUD_LIGHT);
  }
  return outline(r, INK, 1);
}

// ── The blast: 48×48, centred 30 px down (the bomb's feet), a flash that swells and breaks into smoke ──

const FIRE = hex(C.ember);
const FIRE_LIGHT = hex(C.emberLight);
const SMOKE = hex('#6b6560');
const SMOKE_LIGHT = hex('#8d8782');

function blastFrame(i: number): Raster {
  const r = createRaster(48, 48);
  const cy = 30 - i;
  if (i < 3) {
    const k = 8 + i * 6;
    ellipse(r, 24, cy, k + 2, k, FIRE);
    ellipse(r, 24, cy, k - 2, k - 3, FIRE_LIGHT);
    ellipse(r, 24, cy, Math.max(2, k - 8), Math.max(2, k - 9), SPARK);
    return r;
  }
  // Smoke clouds drifting apart and thinning.
  const n = 6 - i;
  for (const [dx, dy] of [
    [-10, -4],
    [10, -4],
    [0, -12],
    [-6, 6],
    [7, 6],
  ] as const) {
    const spread = 1 + (i - 3) * 0.4;
    ellipse(r, 24 + dx * spread, cy + dy * spread, n + 2, n + 1, SMOKE);
    ellipse(r, 23 + dx * spread, cy - 1 + dy * spread, n, n - 1, SMOKE_LIGHT);
  }
  return r;
}

export function sokkvaFrames(): SpriteFrame[] {
  const prop = (name: string, raster: Raster): SpriteFrame => ({
    name,
    raster,
    ox: Math.floor(raster.w / 2),
    oy: raster.h - 1,
  });
  const fixture = (name: string, raster: Raster): SpriteFrame => ({ name, raster, ox: 9, oy: raster.h - 3 });
  const crabs: SpriteFrame[] = [];
  const views: readonly [Dir4, 'front' | 'back' | 'side'][] = [
    ['s', 'front'],
    ['n', 'back'],
    ['w', 'side'],
  ];
  for (const [dir, side] of views) {
    const add = (anim: string, i: number, pose: CrabPose): void => {
      const raster = crab(side, pose);
      crabs.push({ name: `enemy_leirkrabbi_${anim}_${dir}_${i}`, raster, ox: 16, oy: 21 });
      if (dir === 'w')
        crabs.push({ name: `enemy_leirkrabbi_${anim}_e_${i}`, raster: flipX(raster), ox: 16, oy: 21 });
    };
    add('idle', 0, 'rest');
    add('walk', 0, 'rest');
    add('walk', 1, 'step');
    add('tell', 0, 'raise');
    add('pinch', 0, 'snap');
    add('hurt', 0, 'hurt');
  }
  const worm: SpriteFrame[] = [];
  const wormPoses: readonly (readonly [string, WormPose])[] = [
    ['idle', 'rear'],
    ['hidden', 'hidden'],
    ['tell', 'tell'],
    ['rear', 'rear'],
    ['roar', 'roar'],
    ['ripple', 'ripple'],
    ['dazed', 'dazed'],
    ['coil', 'coil'],
    ['charge', 'charge'],
    ['burrow', 'burrow'],
  ];
  for (const [dir, side] of views)
    for (const [anim, pose] of wormPoses) {
      const raster = serpent(side, pose);
      worm.push({ name: `enemy_lindormr_${anim}_${dir}_0`, raster, ox: 24, oy: 44 });
      if (dir === 'w')
        worm.push({ name: `enemy_lindormr_${anim}_e_0`, raster: flipX(raster), ox: 24, oy: 44 });
    }
  for (const dir of ALL) {
    worm.push({ name: `enemy_lind_mound_idle_${dir}_0`, raster: mound(null), ox: 14, oy: 21 });
    worm.push({ name: `enemy_lind_mound_bubble_${dir}_0`, raster: mound(0), ox: 14, oy: 21 });
    worm.push({ name: `enemy_lind_mound_bubble_${dir}_1`, raster: mound(1), ox: 14, oy: 21 });
  }
  const blasts = Array.from({ length: 6 }, (_, i) => ({
    name: `fx_blast_idle_s_${String(i)}`,
    raster: blastFrame(i),
    ox: 24,
    oy: 30,
  }));
  return [
    ...blasts,
    ...crabs,
    ...worm,
    prop('prop_bomb_idle_s_0', bomb('rest')),
    prop('prop_bomb_fuse_s_0', bomb('rest')),
    prop('prop_bomb_fuse_s_1', bomb('spark')),
    prop('prop_bomb_blink_s_0', bomb('spark')),
    prop('prop_bomb_blink_s_1', bomb('flash')),
    prop('prop_bomb_pot_idle_s_0', bombPot()),
    fixture('fix_biglock_closed_s_0', bigLock(false)),
    fixture('fix_biglock_open_s_0', bigLock(true)),
    fixture('fix_wheel_on_s_0', wheel(true)),
    fixture('fix_wheel_off_s_0', wheel(false)),
    fixture('fix_crack_wall_closed_s_0', crackedWall()),
    fixture('fix_crack_wall_open_s_0', blownWall()),
    fixture('fix_crack_rock_closed_s_0', crackedRock()),
    fixture('fix_crack_rock_open_s_0', rubble()),
  ];
}

const one = (frames: number, fps: number): AnimDef => ({ frames, fps, loop: true, dirs: ['s'] });

const ALL: readonly Dir4[] = ['s', 'n', 'w', 'e'];
const all = (frames: number, fps: number): AnimDef => ({ frames, fps, loop: true, dirs: ALL });

export const SOKKVA_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  fx_blast: { idle: { frames: 6, fps: 15, loop: false, dirs: ['s'] } },
  enemy_lindormr: {
    idle: all(1, 1),
    hidden: all(1, 1),
    tell: all(1, 1),
    rear: all(1, 1),
    roar: all(1, 1),
    ripple: all(1, 1),
    dazed: all(1, 1),
    coil: all(1, 1),
    charge: all(1, 1),
    burrow: all(1, 1),
  },
  enemy_lind_mound: { idle: all(1, 1), bubble: all(2, 6) },
  enemy_leirkrabbi: { idle: all(1, 1), walk: all(2, 8), tell: all(1, 1), pinch: all(1, 1), hurt: all(1, 1) },
  prop_bomb: { idle: one(1, 1), fuse: one(2, 6), blink: one(2, 12) },
  prop_bomb_pot: { idle: one(1, 1) },
  fix_biglock: { closed: one(1, 1), open: one(1, 1) },
  fix_wheel: { on: one(1, 1), off: one(1, 1) },
  fix_crack_wall: { closed: one(1, 1), open: one(1, 1) },
  fix_crack_rock: { closed: one(1, 1), open: one(1, 1) },
};
