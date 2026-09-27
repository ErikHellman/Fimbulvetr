import type { AnimDef } from '../anims';
import { ellipse, rect } from '../draw';
import { outline } from '../outline';
import { C } from '../palette';
import { createRaster, hex, setPixel, TRANSPARENT, type Raster, type Rgba } from '../raster';
import type { SpriteFrame } from './types';

/**
 * Decor: the objects that stand on a block of solid tiles (trees, the well, furniture). Each is drawn once,
 * with a 1 px margin and a 1 px ink outline, and stands on its bottom centre.
 */

const INK = hex(C.ink);
const P = Object.fromEntries(Object.entries(C).map(([k, v]) => [k, hex(v)])) as Record<keyof typeof C, Rgba>;

function frame(name: string, r: Raster): SpriteFrame {
  return { name, raster: outline(r, INK, 1), ox: Math.floor(r.w / 2), oy: r.h - 1 };
}

/** A round leaf tree: 4×10 trunk, a two-lobed canopy shaded to the lower right. */
function tree(): Raster {
  const r = createRaster(32, 40);
  rect(r, 14, 26, 4, 12, P.trunk);
  rect(r, 17, 26, 1, 12, P.woodShade);
  const shade = (cx: number, cy: number) => (x: number, y: number) =>
    x - cx + (y - cy) > 6 ? P.leafShade : P.leaf;
  ellipse(r, 16, 16, 14, 12, shade(16, 16));
  ellipse(r, 21, 8, 7, 5, shade(21, 8));
  ellipse(r, 10, 10, 3.5, 3, P.leafLight);
  return r;
}

/** A spruce: three widening tiers on a short trunk, shaded on the right. */
function pine(): Raster {
  const r = createRaster(24, 44);
  rect(r, 10, 34, 4, 8, P.trunk);
  rect(r, 13, 34, 1, 8, P.woodShade);
  for (let tier = 0; tier < 3; tier++) {
    const top = 3 + tier * 10;
    const baseHalf = 5 + tier * 3;
    for (let i = 0; i < 12; i++) {
      const half = Math.max(1, Math.round(((i + 1) * baseHalf) / 12));
      rect(r, 12 - half, top + i, half * 2, 1, P.leaf);
      rect(
        r,
        12 + half - Math.max(1, Math.floor(half / 3)),
        top + i,
        Math.max(1, Math.floor(half / 3)),
        1,
        P.leafShade,
      );
    }
  }
  rect(r, 9, 6, 2, 1, P.leafLight);
  rect(r, 8, 16, 2, 1, P.leafLight);
  return r;
}

/** The well: a stone ring under a gabled roof on two posts, with a crank, a rope and a bucket. */
function well(f: number): Raster {
  const r = createRaster(32, 44);
  for (let i = 0; i < 8; i++) {
    const half = Math.min(14, 4 + Math.floor(i * 1.5));
    rect(r, 16 - half, 2 + i, half * 2, 1, i === 0 ? P.wood : P.woodShade);
  }
  rect(r, 6, 9, 3, 26, P.wood);
  rect(r, 23, 9, 3, 26, P.wood);
  rect(r, 8, 9, 1, 26, P.woodShade);
  rect(r, 25, 9, 1, 26, P.woodShade);
  rect(r, 6, 20, 20, 2, P.woodShade);
  rect(r, 26, 20, 4, 1, P.rockShade);
  rect(r, 29, 17, 1, 4, P.rockShade);
  rect(r, 16, 22, 1, 12, P.strawShade);
  rect(r, 14, 28, 4, 3, P.pailShade);
  ellipse(r, 16, 36, 14, 6, (x, y) => (x - 16 + (y - 36) > 3 ? P.rockShade : P.rock));
  ellipse(r, 16, 35, 9, 3.5, INK);
  ellipse(r, 16, 35, 7, 2.5, P.water);
  rect(r, 10 + f * 2, 34, 2, 1, P.waterLight);
  rect(r, 20 - f, 36, 2, 1, P.waterLight);
  if (f % 2 === 1) setPixel(r, f === 1 ? 13 : 19, 35, P.waterLight);
  return r;
}

/** A long wooden trough on two legs; ripples drift along the water. */
function trough(f: number): Raster {
  const r = createRaster(48, 20);
  rect(r, 2, 5, 44, 12, INK);
  rect(r, 3, 6, 42, 10, P.wood);
  rect(r, 3, 13, 42, 3, P.woodShade);
  rect(r, 5, 8, 40, 4, P.water);
  for (let k = 0; k < 5; k++)
    for (let i = 0; i < 3; i++) rect(r, 5 + ((k * 8 + f * 2 + i) % 40), 9 + (k % 2), 1, 1, P.waterLight);
  rect(r, 5, 17, 3, 2, P.woodShade);
  rect(r, 40, 17, 3, 2, P.woodShade);
  return r;
}

/** A stone hearth with two logs and a flame that sways and stretches. */
function hearth(f: number): Raster {
  const r = createRaster(32, 36);
  ellipse(r, 16, 28, 14, 6, (x, y) => (x - 16 + (y - 28) > 3 ? P.rockShade : P.rock));
  ellipse(r, 16, 27, 9, 3.5, INK);
  rect(r, 10, 26, 12, 2, P.woodShade);
  rect(r, 12, 24, 8, 2, P.wood);
  const sway = [0, 1, 0, -1][f] ?? 0;
  const tall = f % 2;
  ellipse(r, 16 + sway, 20 - tall, 5, 7 + tall, P.ember);
  ellipse(r, 16 + sway, 22, 2.5, 4, P.emberLight);
  if (tall === 1) rect(r, 15 + sway, 10, 2, 2, P.ember);
  const glow: ReadonlyArray<readonly [number, number]> = [
    [6, 30],
    [26, 29],
    [10, 32],
    [22, 32],
  ];
  glow.forEach(([x, y], i) => {
    if ((i + f) % 4 < 2) setPixel(r, x, y, P.emberLight);
  });
  return r;
}

function bed(): Raster {
  const r = createRaster(16, 30);
  rect(r, 1, 1, 14, 28, INK);
  rect(r, 2, 2, 12, 26, P.straw);
  rect(r, 3, 3, 10, 5, P.sack);
  rect(r, 2, 10, 12, 17, P.blanket);
  rect(r, 2, 25, 12, 2, P.blanketShade);
  rect(r, 2, 27, 12, 1, P.woodShade);
  return r;
}

function table(): Raster {
  const r = createRaster(32, 22);
  rect(r, 2, 3, 28, 10, P.wood);
  rect(r, 2, 12, 28, 1, P.woodShade);
  rect(r, 3, 13, 3, 7, P.woodShade);
  rect(r, 26, 13, 3, 7, P.woodShade);
  rect(r, 8, 6, 4, 2, P.clay);
  rect(r, 20, 7, 3, 2, P.straw);
  return r;
}

function stump(): Raster {
  const r = createRaster(16, 18);
  rect(r, 2, 7, 12, 9, P.woodShade);
  for (const x of [4, 8, 12]) rect(r, x, 8, 1, 7, P.wood);
  ellipse(r, 8, 7, 6.5, 3.5, P.straw);
  ellipse(r, 8, 7, 3, 1.5, P.strawShade);
  return r;
}

function menhir(): Raster {
  const r = createRaster(16, 30);
  rect(r, 4, 2, 8, 26, P.rock);
  rect(r, 9, 2, 3, 26, P.rockShade);
  for (const [x, y] of [
    [4, 2],
    [11, 2],
    [4, 27],
    [11, 27],
  ] as const)
    setPixel(r, x, y, TRANSPARENT);
  rect(r, 6, 7, 1, 4, INK);
  rect(r, 7, 8, 2, 1, INK);
  rect(r, 7, 15, 1, 6, INK);
  rect(r, 6, 17, 3, 1, INK);
  return r;
}

/** The first runestone: a tall grey slab cut with a serpent band and runes that glow once it is lit. */
function runestone(): Raster {
  const r = createRaster(18, 34);
  rect(r, 3, 3, 12, 29, P.rock);
  rect(r, 11, 3, 4, 29, P.rockShade);
  rect(r, 4, 2, 10, 1, P.rock);
  rect(r, 5, 1, 7, 1, P.rockLight);
  for (const [x, y] of [
    [3, 3],
    [14, 3],
  ] as const)
    setPixel(r, x, y, TRANSPARENT);
  // The serpent band: a ring of ink down both sides, closing over the top.
  rect(r, 5, 6, 1, 22, INK);
  rect(r, 12, 6, 1, 22, INK);
  rect(r, 6, 5, 6, 1, INK);
  for (let y = 9; y < 26; y += 4) {
    rect(r, 8, y, 1, 3, P.rune);
    rect(r, 7, y + 1, 3, 1, P.rune);
  }
  return r;
}

/** An old pine of Myrkviðr: taller, darker and ragged, four tiers. */
function oldPine(): Raster {
  const r = createRaster(28, 54);
  rect(r, 12, 44, 4, 8, P.trunk);
  rect(r, 15, 44, 1, 8, P.woodShade);
  for (let tier = 0; tier < 4; tier++) {
    const top = 2 + tier * 10;
    const baseHalf = 4 + tier * 2.5;
    for (let i = 0; i < 12; i++) {
      const ragged = (i + tier) % 4 === 0 ? 1 : 0;
      const half = Math.max(1, Math.round(((i + 1) * baseHalf) / 12) - ragged);
      rect(r, 14 - half, top + i, half * 2, 1, P.leafShade);
      rect(r, 14 - half, top + i, Math.max(1, half - 1), 1, P.leaf);
    }
  }
  rect(r, 11, 13, 2, 1, P.leafLight);
  return r;
}

/** A fallen trunk lying across four tiles, its root plate on the left and a broken end on the right. */
function fallenLog(): Raster {
  const r = createRaster(66, 22);
  rect(r, 6, 8, 56, 10, P.trunk);
  rect(r, 6, 14, 56, 4, P.woodShade);
  for (const x of [14, 27, 41, 52]) rect(r, x, 9, 1, 5, P.woodShade);
  ellipse(r, 7, 12, 5, 9, (x) => (x < 6 ? P.dirtShade : P.dirt));
  rect(r, 3, 4, 2, 3, P.trunk);
  rect(r, 9, 2, 2, 4, P.trunk);
  ellipse(r, 61, 13, 3, 5, P.straw);
  ellipse(r, 61, 13, 1.5, 2.5, P.strawShade);
  rect(r, 30, 5, 6, 3, P.leafShade);
  rect(r, 31, 4, 3, 1, P.leaf);
  return r;
}

/** A charcoal kiln: a dome of turf and earth over the stacked wood, a smoking vent on top. */
function kiln(): Raster {
  const r = createRaster(50, 36);
  ellipse(r, 25, 22, 23, 12.5, (x, y) => (x - 25 + (y - 20) > 14 ? P.dirtShade : P.dirt));
  for (const [x, y] of [
    [12, 20],
    [20, 16],
    [30, 18],
    [36, 24],
    [16, 28],
    [27, 27],
  ] as const)
    rect(r, x, y, 4, 2, P.turf);
  rect(r, 22, 8, 6, 4, P.rockShade);
  rect(r, 23, 8, 4, 2, P.ink);
  rect(r, 10, 29, 6, 3, P.ember);
  rect(r, 11, 30, 3, 1, P.emberLight);
  return r;
}

/** A market stall three tiles wide: a trestle of goods under a red and cream striped awning on poles. */
function stall(): Raster {
  const r = createRaster(50, 40);
  rect(r, 3, 12, 2, 26, P.wood);
  rect(r, 45, 12, 2, 26, P.wood);
  for (let x = 1; x < 49; x += 6) {
    rect(r, x, 4, 3, 9, P.heart);
    rect(r, x + 3, 4, 3, 9, P.wool);
  }
  rect(r, 1, 12, 48, 1, P.heartShade);
  rect(r, 2, 26, 46, 4, P.wood);
  rect(r, 2, 30, 46, 2, P.woodShade);
  for (const [x, c] of [
    [6, P.barley],
    [13, P.clay],
    [20, P.heart],
    [27, P.leaf],
    [34, P.sack],
    [41, P.clay],
  ] as const) {
    rect(r, x, 21, 5, 5, c);
    rect(r, x + 3, 21, 2, 5, P.ink);
  }
  rect(r, 5, 32, 2, 6, P.woodShade);
  rect(r, 43, 32, 2, 6, P.woodShade);
  return r;
}

/** The Þing-stone: a broad grey slab with a notice board pinned to its face. */
function thingstone(): Raster {
  const r = createRaster(34, 30);
  rect(r, 2, 4, 30, 24, P.rock);
  rect(r, 24, 4, 8, 24, P.rockShade);
  rect(r, 4, 2, 24, 2, P.rock);
  rect(r, 6, 1, 18, 1, P.rockLight);
  for (const [x, y] of [
    [2, 4],
    [31, 4],
  ] as const)
    setPixel(r, x, y, TRANSPARENT);
  rect(r, 9, 8, 16, 12, P.wood);
  rect(r, 10, 9, 14, 10, P.sack);
  for (let y = 11; y < 18; y += 3) rect(r, 12, y, 10, 1, P.woodShade);
  rect(r, 16, 7, 2, 2, P.ink);
  return r;
}

/** The smith's anvil on a stump. */
function anvil(): Raster {
  const r = createRaster(18, 18);
  rect(r, 5, 9, 8, 7, P.trunk);
  rect(r, 10, 9, 3, 7, P.woodShade);
  rect(r, 2, 4, 14, 3, P.hoop);
  rect(r, 1, 4, 2, 2, P.hoop);
  rect(r, 5, 7, 8, 2, P.rockShade);
  rect(r, 3, 4, 10, 1, P.steel);
  return r;
}

/** A clump of fen reeds with brown seed heads. */
function reeds(): Raster {
  const r = createRaster(16, 26);
  const stems: ReadonlyArray<readonly [number, number]> = [
    [3, 8],
    [5, 3],
    [7, 6],
    [9, 1],
    [11, 5],
    [13, 9],
  ];
  for (const [x, top] of stems) {
    rect(r, x, top, 1, 24 - top, P.leaf);
    rect(r, x + 1, top + 4, 1, 20 - top, P.leafShade);
    rect(r, x, top, 1, 4, P.trunk);
  }
  rect(r, 2, 22, 13, 2, P.leafShade);
  return r;
}

/** A white birch: a slim pale trunk with black marks, a light round crown. */
function birch(): Raster {
  const r = createRaster(24, 44);
  rect(r, 10, 20, 4, 22, hex('#e8e4da'));
  rect(r, 13, 20, 1, 22, hex('#b8b2a4'));
  for (const [x, y] of [
    [10, 24],
    [12, 29],
    [10, 34],
    [11, 38],
  ] as const)
    rect(r, x, y, 2, 1, INK);
  const shade = (x: number, y: number) => (x - 12 + (y - 12) > 6 ? P.leaf : P.leafLight);
  ellipse(r, 12, 12, 10, 11, shade);
  ellipse(r, 8, 8, 3, 2.5, hex('#9cc878'));
  return r;
}

/** A round boulder furred with moss. */
function boulder(): Raster {
  const r = createRaster(18, 18);
  ellipse(r, 9, 10, 8, 7, (x, y) => (x - 9 + (y - 10) > 3 ? P.rockShade : P.rock));
  ellipse(r, 7, 6, 5, 2.5, hex('#4f7a3a'));
  rect(r, 3, 8, 3, 1, hex('#4f7a3a'));
  rect(r, 6, 5, 3, 1, hex('#8aa860'));
  return r;
}

export function decorFrames(): SpriteFrame[] {
  const out: SpriteFrame[] = [
    frame('decor_tree_idle_s_0', tree()),
    frame('decor_pine_idle_s_0', pine()),
    frame('decor_bed_idle_s_0', bed()),
    frame('decor_table_idle_s_0', table()),
    frame('decor_stump_idle_s_0', stump()),
    frame('decor_menhir_idle_s_0', menhir()),
    frame('decor_pine_old_idle_s_0', oldPine()),
    frame('decor_log_idle_s_0', fallenLog()),
    frame('decor_kiln_idle_s_0', kiln()),
    frame('decor_runestone_idle_s_0', runestone()),
    frame('decor_stall_idle_s_0', stall()),
    frame('decor_thingstone_idle_s_0', thingstone()),
    frame('decor_anvil_idle_s_0', anvil()),
    frame('decor_reeds_idle_s_0', reeds()),
    frame('decor_birch_idle_s_0', birch()),
    frame('decor_boulder_idle_s_0', boulder()),
  ];
  for (let f = 0; f < 4; f++) {
    out.push(frame(`decor_well_idle_s_${f}`, well(f)));
    out.push(frame(`decor_trough_idle_s_${f}`, trough(f)));
    out.push(frame(`decor_hearth_idle_s_${f}`, hearth(f)));
  }
  return out;
}

const STILL = { idle: { frames: 1, fps: 1, loop: true, dirs: ['s'] } } satisfies Record<string, AnimDef>;

export const DECOR_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  decor_tree: STILL,
  decor_pine: STILL,
  decor_bed: STILL,
  decor_table: STILL,
  decor_stump: STILL,
  decor_menhir: STILL,
  decor_pine_old: STILL,
  decor_log: STILL,
  decor_kiln: STILL,
  decor_runestone: STILL,
  decor_stall: STILL,
  decor_thingstone: STILL,
  decor_anvil: STILL,
  decor_reeds: STILL,
  decor_birch: STILL,
  decor_boulder: STILL,
  decor_well: { idle: { frames: 4, fps: 4, loop: true, dirs: ['s'] } },
  decor_trough: { idle: { frames: 4, fps: 4, loop: true, dirs: ['s'] } },
  decor_hearth: { idle: { frames: 4, fps: 8, loop: true, dirs: ['s'] } },
};
