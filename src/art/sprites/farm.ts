import type { AnimDef } from '../anims';
import { ellipse, rect } from '../draw';
import { decodeGrid, type GridPalette } from '../grid';
import { outline } from '../outline';
import { C } from '../palette';
import { blit, createRaster, flipX, hex, type Raster, type Rgba } from '../raster';
import type { SpriteFrame } from './types';

const INK = hex(C.ink);
const W = hex(C.wool);
const WS = hex(C.woolShade);
const FACE = hex(C.sheepFace);

/** Sheep, side view facing west; `phase` moves the legs. */
function sheepSide(phase: number): Raster {
  const r = createRaster(26, 22);
  const step = phase === 1 ? 1 : 0;
  rect(r, 7 + step, 15, 2, 4, FACE);
  rect(r, 16 - step, 15, 2, 4, FACE);
  ellipse(r, 13, 11, 8, 5.5, (x, y) => (y > 12 || x > 17 ? WS : W));
  ellipse(r, 5, 8, 3, 3.5, FACE);
  rect(r, 4, 7, 1, 1, W);
  rect(r, 6, 4, 2, 2, FACE);
  return outline(r, INK, 2);
}

function sheepFront(back: boolean, phase: number): Raster {
  const r = createRaster(22, 22);
  const step = phase === 1 ? 1 : 0;
  rect(r, 7, 15 - step, 2, 4 + step, FACE);
  rect(r, 13, 15 - (1 - step), 2, 4 + (1 - step), FACE);
  ellipse(r, 11, 11, 7, 6, (x) => (x > 13 ? WS : W));
  if (back) rect(r, 10, 15, 2, 2, WS);
  else {
    ellipse(r, 11, 8, 3, 3.5, FACE);
    rect(r, 7, 6, 2, 1, FACE);
    rect(r, 13, 6, 2, 1, FACE);
  }
  return outline(r, INK, 2);
}

const RAVEN = hex(C.raven);
const RAVEN_S = hex(C.ravenShade);
const BEAK = hex(C.beak);

/** Raven facing west. `pose`: 0 standing, 1 pecking, 2 wings up, 3 wings down. */
function raven(pose: 0 | 1 | 2 | 3): Raster {
  const r = createRaster(20, 18);
  rect(r, 9, 13, 1, 2, BEAK);
  rect(r, 11, 13, 1, 2, BEAK);
  ellipse(r, 11, 10, 5, 3.5, (x) => (x > 12 ? RAVEN_S : RAVEN));
  rect(r, 15, 9, 3, 2, RAVEN_S);
  const hy = pose === 1 ? 11 : 7;
  ellipse(r, 7, hy, 2.5, 2.5, RAVEN);
  rect(r, 3, hy, 2, 1, BEAK);
  rect(r, 6, hy - 1, 1, 1, hex(C.wool));
  if (pose === 2) {
    rect(r, 9, 3, 6, 4, RAVEN_S);
    rect(r, 10, 2, 3, 1, RAVEN_S);
  }
  if (pose === 3) rect(r, 9, 11, 7, 3, RAVEN_S);
  return outline(r, INK, 1);
}

const PROP_PAL: GridPalette = {
  '.': null,
  c: C.clay,
  C: C.clayShade,
  r: C.rock,
  R: C.rockShade,
  l: C.rockLight,
  w: C.pail,
  W: C.pailShade,
  h: C.hoop,
  b: C.wood,
  B: C.woodShade,
  s: C.straw,
  e: C.ink,
  a: C.water,
};

const POT = [
  '....cccccc....',
  '...CCCCCCCC...',
  '....cccccC....',
  '..cccccccccC..',
  '.cccccccccccC.',
  '.ccccccccccCC.',
  '.cccccccccCCC.',
  '..ccccccccCC..',
  '...ccccccCC...',
  '....CCCCCC....',
];

const STONE = [
  '....rrrrR...',
  '..rrlrrrrR..',
  '.rrlrrrrrRR.',
  '.rrrrrrrrRR.',
  '.rrrrrrrRRR.',
  '..rrrrrRRR..',
  '...RRRRRR...',
];

const ROCK = [
  '.....rrrrrR.....',
  '...rrrlrrrrRR...',
  '..rrllrrrrrrRR..',
  '.rrrlrrrrrrrRRR.',
  '.rrrrrrrrrrRRRR.',
  'rrrrrrrrrrrRRRRR',
  'rrrrrrrrrrRRRRRR',
  '.rrrrrrrrRRRRRR.',
  '..rrrrrrRRRRRR..',
  '....RRRRRRRR....',
];

const PAIL = [
  '...hhhhhhhh...',
  '..h........h..',
  '.h..........h.',
  '.WaaaaaaaaaaW.',
  '.wwwwwwwwwwwW.',
  '.hhhhhhhhhhhh.',
  '..wwwwwwwwwW..',
  '..wwwwwwwwwW..',
  '..hhhhhhhhhh..',
  '...WWWWWWWW...',
];

const LOG_SMALL = [
  '...BBBBBB...',
  '..BbbbbbbB..',
  '.BbssssssbB.',
  '.BbsbbbbsbB.',
  '.BbsbssbsbB.',
  '.BbsbbbbsbB.',
  '.BbssssssbB.',
  '..BbbbbbbB..',
  '...BBBBBB...',
];

const LOG_BIG = [
  '.....BBBBBBBB.....',
  '...BBbbbbbbbbBB...',
  '..BbbssssssssbbB..',
  '.BbssbbbbbbbbssbB.',
  '.BbsbbssssssbbsbB.',
  '.BbsbsbbbbbbsbsbB.',
  '.BbsbsbssssbsbsbB.',
  '.BbsbsbbbbbbsbsbB.',
  '.BbsbbssssssbbsbB.',
  '.BbssbbbbbbbbssbB.',
  '..BbbssssssssbbB..',
  '...BBbbbbbbbbBB...',
  '.....BBBBBBBB.....',
];

/** Centres a grid in a frame with a 1 px outline margin; the feet point is the bottom centre. */
function propFrame(name: string, grid: readonly string[]): SpriteFrame {
  const g = decodeGrid(grid, PROP_PAL);
  const r = createRaster(g.w + 2, g.h + 2);
  blit(r, g, 1, 1);
  return { name, raster: outline(r, INK, 1), ox: Math.floor(r.w / 2), oy: r.h - 1 };
}

const HEART_PAL: GridPalette = { '.': null, h: C.heart, H: C.heartShade, l: C.heartLight, e: C.ink };
const HEART_PIECE = [
  '.hhh.......',
  'hlhhh......',
  'hlhhhh.....',
  'hhhhhhe....',
  'hhhhhHe....',
  '.hhhHHe....',
  '..hHHHe....',
  '...HHee....',
  '....e......',
];

function heartFrames(): SpriteFrame[] {
  return [0, 1].map((i) => {
    const g = decodeGrid(HEART_PIECE, HEART_PAL);
    const r = createRaster(g.w + 4, g.h + 4);
    blit(r, g, 2, 2);
    const done = outline(r, INK, 1);
    if (i === 1) {
      const glint: Rgba = [255, 255, 255, 255];
      rect(done, 3, 3, 1, 1, glint);
    }
    return {
      name: `pickup_heart_piece_idle_s_${i}`,
      raster: done,
      ox: Math.floor(done.w / 2),
      oy: done.h - 1,
    };
  });
}

const SMALL_HEART = ['.hh.hh.', 'hlhhhhH', 'hhhhhhH', '.hhhhH.', '..hHH..', '...H...'];
const COIN = ['.sss.', 'sSsss', 'sSsss', 'sSsss', '.sss.'];
const COIN_PAL: GridPalette = { '.': null, s: C.shieldRim, S: C.strawShade, l: C.heartLight };
const JAR = ['.ccc.', '..g..', '.ggg.', 'gglgG', 'ggggG', '.gGG.'];
const JAR_PAL: GridPalette = { '.': null, c: C.wood, g: C.rune, G: '#4a9cb4', l: '#ffffff' };

/** Enemy drops: a small heart and a silver coin that glints. Feet at the bottom centre. */
function dropFrames(): SpriteFrame[] {
  const hg = decodeGrid(SMALL_HEART, HEART_PAL);
  const hr = createRaster(hg.w + 2, hg.h + 2);
  blit(hr, hg, 1, 1);
  const hd = outline(hr, INK, 1);
  const heart = { name: 'pickup_heart_idle_s_0', raster: hd, ox: Math.floor(hd.w / 2), oy: hd.h - 1 };
  const coins = [0, 1].map((i) => {
    const g = decodeGrid(COIN, COIN_PAL);
    const r = createRaster(g.w + 2, g.h + 2);
    blit(r, g, 1, 1);
    const done = outline(r, INK, 1);
    if (i === 1) rect(done, 3, 2, 1, 1, [255, 255, 255, 255]);
    return { name: `pickup_silver_idle_s_${i}`, raster: done, ox: Math.floor(done.w / 2), oy: done.h - 1 };
  });
  const jars = [0, 1].map((i) => {
    const g = decodeGrid(JAR, JAR_PAL);
    const r = createRaster(g.w + 2, g.h + 3);
    blit(r, g, 1, 1 + i);
    const done = outline(r, INK, 1);
    return { name: `pickup_seidr_idle_s_${i}`, raster: done, ox: Math.floor(done.w / 2), oy: done.h - 1 };
  });
  return [heart, ...coins, ...jars];
}

/** Soft ground shadow drawn under anything lifted off the ground. */
function shadowFrame(): SpriteFrame {
  const r = createRaster(14, 6);
  ellipse(r, 7, 3, 6.5, 2.5, [0, 0, 0, 80]);
  return { name: 'fx_shadow_idle_s_0', raster: r, ox: 7, oy: 3 };
}

export function farmFrames(): SpriteFrame[] {
  const out: SpriteFrame[] = [];
  const sheep = (anim: string, dir: string, i: number, r: Raster): void => {
    out.push({ name: `critter_sheep_${anim}_${dir}_${i}`, raster: r, ox: Math.floor(r.w / 2), oy: r.h - 3 });
  };
  for (const i of [0, 1]) {
    const side = sheepSide(i);
    sheep('walk', 'w', i, side);
    sheep('walk', 'e', i, flipX(side));
    sheep('walk', 's', i, sheepFront(false, i));
    sheep('walk', 'n', i, sheepFront(true, i));
  }
  sheep('idle', 'w', 0, sheepSide(0));
  sheep('idle', 'e', 0, flipX(sheepSide(0)));
  sheep('idle', 's', 0, sheepFront(false, 0));
  sheep('idle', 'n', 0, sheepFront(true, 0));

  const bird = (anim: string, i: number, r: Raster): void => {
    out.push({ name: `critter_raven_${anim}_w_${i}`, raster: r, ox: 10, oy: 15 });
    out.push({ name: `critter_raven_${anim}_e_${i}`, raster: flipX(r), ox: 10, oy: 15 });
  };
  bird('idle', 0, raven(0));
  bird('peck', 0, raven(0));
  bird('peck', 1, raven(1));
  bird('hop', 0, raven(2));
  bird('hop', 1, raven(0));
  bird('fly', 0, raven(2));
  bird('fly', 1, raven(3));

  out.push(propFrame('prop_pot_idle_s_0', POT));
  out.push(propFrame('prop_stone_idle_s_0', STONE));
  out.push(propFrame('prop_rock_idle_s_0', ROCK));
  out.push(propFrame('prop_pail_idle_s_0', PAIL));
  out.push(propFrame('prop_log_small_idle_s_0', LOG_SMALL));
  out.push(propFrame('prop_log_big_idle_s_0', LOG_BIG));
  out.push(...heartFrames(), ...dropFrames(), shadowFrame());
  return out;
}

const ONE_S = { idle: { frames: 1, fps: 1, loop: true, dirs: ['s'] } } satisfies Record<string, AnimDef>;
const SIDES = ['w', 'e'] as const;

export const FARM_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  critter_sheep: {
    idle: { frames: 1, fps: 1, loop: true, dirs: ['s', 'n', 'w', 'e'] },
    walk: { frames: 2, fps: 5, loop: true, dirs: ['s', 'n', 'w', 'e'] },
  },
  critter_raven: {
    idle: { frames: 1, fps: 1, loop: true, dirs: SIDES },
    peck: { frames: 2, fps: 3, loop: true, dirs: SIDES },
    hop: { frames: 2, fps: 8, loop: true, dirs: SIDES },
    fly: { frames: 2, fps: 10, loop: true, dirs: SIDES },
  },
  prop_pot: ONE_S,
  prop_stone: ONE_S,
  prop_rock: ONE_S,
  prop_pail: ONE_S,
  prop_log_small: ONE_S,
  prop_log_big: ONE_S,
  pickup_heart_piece: { idle: { frames: 2, fps: 2, loop: true, dirs: ['s'] } },
  pickup_heart: ONE_S,
  pickup_silver: { idle: { frames: 2, fps: 3, loop: true, dirs: ['s'] } },
  /** A seiðr jar, bobbing. */
  pickup_seidr: { idle: { frames: 2, fps: 2, loop: true, dirs: ['s'] } },
  fx_shadow: ONE_S,
};
