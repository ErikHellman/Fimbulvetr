import type { AnimDef } from '../anims';
import { ellipse, rect } from '../draw';
import { outline } from '../outline';
import { C } from '../palette';
import { createRaster, hex, type Raster, type Rgba } from '../raster';
import type { SpriteFrame } from './types';

/**
 * Room fixtures, one tile each: 18 px wide (a 1 px margin around the tile's 16 columns), feet on the
 * row 2 px above the tile's bottom edge like everything standing on a tile.
 */
const W = 18;
const INK = hex(C.ink);
const EMBER = hex(C.ember);
const EMBER_LIGHT = hex(C.emberLight);
const FLAME_TIP: Rgba = [255, 236, 150, 255];
const ASH = hex('#3a3330');
const WOOD = hex(C.wood);
const WOOD_SHADE = hex(C.woodShade);
const STRAW = hex(C.straw);
const IRON = hex(C.hoop);
const GOLD = hex(C.shieldRim);
const ROCK = hex(C.rock);
const ROCK_SHADE = hex(C.rockShade);
const ROCK_LIGHT = hex(C.rockLight);
const RUNE = hex(C.rune);
const DARK = hex('#241c1c');
const ROOT = hex(C.root);
const ROOT_SHADE = hex(C.rootShade);
const HEART = hex(C.heart);
const HEART_SHADE = hex(C.heartShade);
const HEART_LIGHT = hex(C.heartLight);

/** A frame of height `h` whose tile fills the bottom 16 rows above a 1 px margin. */
function fixtureFrame(name: string, raster: Raster): SpriteFrame {
  return { name, raster, ox: 9, oy: raster.h - 3 };
}

const FIRE_H = 27;

function flames(i: number): Raster {
  const r = createRaster(W, FIRE_H);
  const base = FIRE_H - 4;
  rect(r, 3, base - 1, 12, 3, WOOD_SHADE);
  ellipse(r, 9, base - 5, 6.5, 5, EMBER);
  ellipse(r, 9, base - 4, 3.5, 3, EMBER_LIGHT);
  [5, 9, 13].forEach((x, k) => {
    const h = 4 + ((i + k) % 3) * 2;
    const cx = x + ([0, 1, 0, -1][(i + k) % 4] ?? 0) * 0.5;
    ellipse(r, cx, base - 8 - h / 2, 2.2, h / 2 + 1, EMBER);
    rect(r, Math.round(cx), base - 9 - h, 1, 2, FLAME_TIP);
  });
  return r;
}

function ashes(): Raster {
  const r = createRaster(W, FIRE_H);
  const base = FIRE_H - 4;
  ellipse(r, 9, base, 7, 2.5, ASH);
  rect(r, 4, base - 1, 10, 2, hex('#2a2422'));
  rect(r, 6, base, 1, 1, EMBER);
  rect(r, 11, base - 1, 1, 1, EMBER);
  rect(r, 9, base + 1, 1, 1, EMBER_LIGHT);
  return r;
}

const STAKE_H = 33;

/** A stretch of the palisade gate: three sharpened stakes and two cross-bars. */
function palisade(): Raster {
  const r = createRaster(W, STAKE_H);
  for (const x of [1, 6, 11]) {
    rect(r, x, 8, 6, STAKE_H - 11, WOOD);
    rect(r, x + 4, 8, 2, STAKE_H - 11, WOOD_SHADE);
    rect(r, x + 1, 5, 4, 3, WOOD);
    rect(r, x + 2, 3, 2, 2, WOOD);
  }
  rect(r, 1, 13, 16, 2, WOOD_SHADE);
  rect(r, 1, 24, 16, 2, WOOD_SHADE);
  return outline(r, INK, 1);
}

/** The gate thrown open: its bar lying on the ground. */
function threshold(): Raster {
  const r = createRaster(W, STAKE_H);
  rect(r, 1, STAKE_H - 7, 16, 4, WOOD);
  rect(r, 1, STAKE_H - 4, 16, 1, WOOD_SHADE);
  rect(r, 3, STAKE_H - 6, 1, 2, WOOD_SHADE);
  rect(r, 14, STAKE_H - 6, 1, 2, WOOD_SHADE);
  return outline(r, INK, 1);
}

const LOG_H = 24;

/** Logs piled across a path (the fallen tree's trunks, the barred cave mouth). */
function logPile(): Raster {
  const r = createRaster(W, LOG_H);
  const log = (x: number, y: number, w: number): void => {
    rect(r, x, y, w, 5, WOOD);
    rect(r, x, y + 3, w, 2, WOOD_SHADE);
    ellipse(r, x + 1.5, y + 2.5, 1.5, 2.5, STRAW);
  };
  log(1, LOG_H - 8, 16);
  log(3, LOG_H - 13, 12);
  log(5, LOG_H - 18, 8);
  return outline(r, INK, 1);
}

function chips(): Raster {
  const r = createRaster(W, LOG_H);
  for (const [x, y] of [
    [3, 18],
    [6, 20],
    [9, 17],
    [12, 19],
    [14, 16],
    [5, 15],
    [10, 20],
    [7, 18],
    [13, 20],
    [4, 20],
    [11, 15],
  ] as const)
    rect(r, x, y, 2, 1, STRAW);
  rect(r, 2, 19, 14, 1, WOOD_SHADE);
  rect(r, 6, 16, 5, 1, WOOD_SHADE);
  return r;
}

const CHEST_H = 22;

/** A travelling chest: plank sides, iron bands, a gold clasp. */
function chest(open: boolean): Raster {
  const r = createRaster(W, CHEST_H);
  const base = CHEST_H - 3;
  rect(r, 2, base - 9, 14, 10, WOOD);
  rect(r, 2, base - 1, 14, 2, WOOD_SHADE);
  rect(r, 4, base - 9, 2, 10, IRON);
  rect(r, 12, base - 9, 2, 10, IRON);
  if (open) {
    // The lid thrown back, the dark inside showing.
    rect(r, 3, base - 16, 12, 5, WOOD_SHADE);
    rect(r, 4, base - 16, 2, 5, IRON);
    rect(r, 12, base - 16, 2, 5, IRON);
    rect(r, 3, base - 10, 12, 3, DARK);
  } else {
    rect(r, 2, base - 13, 14, 4, WOOD);
    rect(r, 3, base - 14, 12, 1, WOOD);
    rect(r, 2, base - 9, 14, 1, WOOD_SHADE);
    rect(r, 4, base - 14, 2, 5, IRON);
    rect(r, 12, base - 14, 2, 5, IRON);
    rect(r, 8, base - 10, 2, 3, GOLD);
  }
  return outline(r, INK, 1);
}

const DOOR_H = 26;

/** A heavy door barred with iron and a lock plate. */
function lockedDoor(): Raster {
  const r = createRaster(W, DOOR_H);
  rect(r, 1, 3, 16, DOOR_H - 5, WOOD);
  for (const x of [5, 9, 13]) rect(r, x, 3, 1, DOOR_H - 5, WOOD_SHADE);
  rect(r, 1, 7, 16, 2, IRON);
  rect(r, 1, DOOR_H - 8, 16, 2, IRON);
  rect(r, 6, 11, 6, 6, GOLD);
  rect(r, 8, 12, 2, 2, INK);
  rect(r, 8, 14, 2, 2, INK);
  return outline(r, INK, 1);
}

/** Bars of old root, dropped across a doorway, or sunk back into the floor. */
function shutter(open: boolean): Raster {
  const r = createRaster(W, DOOR_H);
  const top = open ? DOOR_H - 6 : 3;
  for (const x of [2, 7, 12]) {
    rect(r, x, top, 4, DOOR_H - 3 - top, ROOT);
    rect(r, x + 3, top, 1, DOOR_H - 3 - top, ROOT_SHADE);
  }
  if (!open) {
    rect(r, 1, 8, 16, 2, ROOT_SHADE);
    rect(r, 1, DOOR_H - 9, 16, 2, ROOT_SHADE);
  }
  return outline(r, INK, 1);
}

const POST_H = 26;

/** A switch stone: a short pillar with a rune eye that glows once struck. */
function switchStone(on: boolean): Raster {
  const r = createRaster(W, POST_H);
  rect(r, 4, 10, 10, POST_H - 13, ROCK);
  rect(r, 11, 10, 3, POST_H - 13, ROCK_SHADE);
  ellipse(r, 9, 8, 5, 5, on ? RUNE : ROCK_SHADE);
  ellipse(r, 8, 7, 2, 2, on ? hex('#e8fbff') : ROCK_LIGHT);
  return outline(r, INK, 1);
}

/** An iron fire-bowl on three legs. */
function brazier(i: number | null): Raster {
  const r = createRaster(W, FIRE_H);
  const base = FIRE_H - 4;
  rect(r, 4, base - 5, 2, 6, IRON);
  rect(r, 12, base - 5, 2, 6, IRON);
  rect(r, 8, base - 4, 2, 5, IRON);
  ellipse(r, 9, base - 7, 7, 3, IRON);
  rect(r, 3, base - 9, 12, 2, hex('#3d4148'));
  if (i === null) {
    rect(r, 5, base - 10, 8, 1, ASH);
    return outline(r, INK, 1);
  }
  [6, 9, 12].forEach((x, k) => {
    const h = 4 + ((i + k) % 3) * 2;
    const cx = x + ([0, 1, 0, -1][(i + k) % 4] ?? 0) * 0.5;
    ellipse(r, cx, base - 11 - h / 2, 2.2, h / 2 + 1, EMBER);
    rect(r, Math.round(cx), base - 12 - h, 1, 2, FLAME_TIP);
  });
  ellipse(r, 9, base - 10, 4, 2, EMBER_LIGHT);
  return outline(r, INK, 1);
}

/** A heart container: a full, bright heart that bobs in place. */
function heartContainer(bob: number): SpriteFrame {
  const r = createRaster(18, 18);
  const y = 3 + bob;
  ellipse(r, 6, y + 3, 3.6, 3.6, HEART);
  ellipse(r, 12, y + 3, 3.6, 3.6, HEART);
  for (let k = 0; k < 7; k++) rect(r, 3 + k, y + 4 + k, 12 - 2 * k, 1, HEART);
  rect(r, 10, y + 6, 4, 3, HEART_SHADE);
  rect(r, 4, y + 2, 2, 2, HEART_LIGHT);
  return { name: `pickup_heart_container_idle_s_${bob}`, raster: outline(r, INK, 1), ox: 9, oy: 16 };
}

export function fixtureFrames(): SpriteFrame[] {
  const out: SpriteFrame[] = [];
  for (let i = 0; i < 4; i++) {
    out.push(fixtureFrame(`fix_fire_burn_s_${i}`, flames(i)));
    out.push(fixtureFrame(`fix_fire_closed_s_${i}`, flames(i)));
  }
  out.push(fixtureFrame('fix_fire_out_s_0', ashes()));
  out.push(fixtureFrame('fix_fire_open_s_0', ashes()));
  out.push(fixtureFrame('fix_palisade_closed_s_0', palisade()));
  out.push(fixtureFrame('fix_palisade_open_s_0', threshold()));
  out.push(fixtureFrame('fix_logs_closed_s_0', logPile()));
  out.push(fixtureFrame('fix_logs_open_s_0', chips()));
  out.push(fixtureFrame('fix_chest_closed_s_0', chest(false)));
  out.push(fixtureFrame('fix_chest_open_s_0', chest(true)));
  out.push(fixtureFrame('fix_lock_closed_s_0', lockedDoor()));
  out.push(fixtureFrame('fix_lock_open_s_0', threshold()));
  out.push(fixtureFrame('fix_shutter_closed_s_0', shutter(false)));
  out.push(fixtureFrame('fix_shutter_open_s_0', shutter(true)));
  out.push(fixtureFrame('fix_switch_off_s_0', switchStone(false)));
  out.push(fixtureFrame('fix_switch_on_s_0', switchStone(true)));
  for (let i = 0; i < 4; i++) out.push(fixtureFrame(`fix_brazier_burn_s_${i}`, brazier(i)));
  out.push(fixtureFrame('fix_brazier_out_s_0', brazier(null)));
  out.push(heartContainer(0), heartContainer(1));
  return out;
}

const ONE: AnimDef = { frames: 1, fps: 1, loop: true, dirs: ['s'] };
const FLICKER: AnimDef = { frames: 4, fps: 8, loop: true, dirs: ['s'] };

export const FIXTURE_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  fix_fire: { burn: FLICKER, closed: FLICKER, out: ONE, open: ONE },
  fix_palisade: { closed: ONE, open: ONE },
  fix_logs: { closed: ONE, open: ONE },
  fix_chest: { closed: ONE, open: ONE },
  fix_lock: { closed: ONE, open: ONE },
  fix_shutter: { closed: ONE, open: ONE },
  fix_switch: { off: ONE, on: ONE },
  fix_brazier: { burn: FLICKER, out: ONE },
  pickup_heart_container: { idle: { frames: 2, fps: 2, loop: true, dirs: ['s'] } },
};
