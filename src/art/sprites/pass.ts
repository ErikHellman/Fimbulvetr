import type { Dir4 } from '@core/math/dir';
import type { AnimDef } from '../anims';
import { line, rect } from '../draw';
import { outline } from '../outline';
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

const ICE = hex('#cfe8f2');
const ICE_SHADE = hex('#8fb8cc');
const ICE_LIGHT = hex('#f4fcff');
const INK = hex(C.ink);

/**
 * One tile of the rime wall across the gorge (18×34, like a slab gate): blue-white ice heaped higher than
 * a man, with cracks of pale light. `open`, only meltwater on the ground.
 */
function rime(open: boolean): Raster {
  const r = createRaster(18, 34);
  const base = 31;
  if (open) {
    rect(r, 1, base - 2, 16, 2, ICE_SHADE);
    return outline(r, INK, 1);
  }
  rect(r, 1, 6, 16, base - 6, ICE);
  rect(r, 12, 6, 5, base - 6, ICE_SHADE);
  rect(r, 3, 3, 6, 4, ICE);
  rect(r, 9, 4, 5, 3, ICE_SHADE);
  rect(r, 2, 7, 3, 12, ICE_LIGHT);
  line(r, 6, 10, 9, 18, ICE_SHADE);
  line(r, 9, 18, 7, 25, ICE_SHADE);
  line(r, 11, 13, 13, 21, ICE_LIGHT);
  return outline(r, INK, 1);
}

const CHAR = hex('#2a2420');
const CHAR_LIGHT = hex('#4a3a2e');
const EMBER = hex('#8a4a2a');
const PLANK = hex('#8a6a44');
const PLANK_SHADE = hex('#5e4630');

/** A patch of burned turf on a roof (16×16, one tile): black char with ragged edges and a last ember. */
function scorch(): Raster {
  const r = createRaster(16, 16);
  rect(r, 2, 3, 12, 10, CHAR);
  rect(r, 4, 1, 7, 3, CHAR);
  rect(r, 1, 6, 2, 5, CHAR);
  rect(r, 13, 5, 2, 6, CHAR);
  rect(r, 5, 13, 6, 2, CHAR);
  rect(r, 5, 5, 3, 2, CHAR_LIGHT);
  rect(r, 9, 8, 3, 2, CHAR_LIGHT);
  rect(r, 7, 10, 1, 1, EMBER);
  return r;
}

/** Fallen, charred beams on the ground (16×16): what is left of a fold or a byre. */
function rubble(): Raster {
  const r = createRaster(16, 16);
  line(r, 1, 11, 14, 6, CHAR);
  line(r, 1, 12, 14, 7, CHAR);
  line(r, 3, 4, 12, 13, CHAR_LIGHT);
  line(r, 4, 4, 13, 13, CHAR);
  rect(r, 6, 12, 4, 2, CHAR);
  rect(r, 9, 9, 1, 1, EMBER);
  return outline(r, INK, 1);
}

/** Planks nailed across a door (16×16): nobody lives here now. */
function boards(): Raster {
  const r = createRaster(16, 16);
  line(r, 2, 4, 13, 7, PLANK);
  line(r, 2, 5, 13, 8, PLANK_SHADE);
  line(r, 2, 10, 13, 12, PLANK);
  line(r, 2, 11, 13, 13, PLANK_SHADE);
  return outline(r, INK, 1);
}

const WATTLE = hex('#9a7a4e');
const WATTLE_SHADE = hex('#6a5034');

/** A wattle hurdle (16×16): two stakes with withies woven between them, a shepherd's movable fence. */
function hurdle(): Raster {
  const r = createRaster(16, 16);
  rect(r, 2, 4, 2, 11, WATTLE_SHADE);
  rect(r, 12, 4, 2, 11, WATTLE_SHADE);
  for (let y = 6; y <= 12; y += 3) {
    line(r, 1, y, 14, y, WATTLE);
    line(r, 1, y + 1, 14, y + 1, WATTLE_SHADE);
  }
  return outline(r, INK, 1);
}

const COMB = hex('#c8962e');
const COMB_SHADE = hex('#8a5e1e');
const BEE = hex('#2a2420');

/** A wild bees' hive hung in a pine (16×16): a lumpy grey-gold comb, a dark entrance and two bees. */
function hive(): Raster {
  const r = createRaster(16, 16);
  rect(r, 4, 3, 8, 10, COMB_SHADE);
  rect(r, 5, 2, 6, 12, COMB);
  rect(r, 3, 5, 10, 6, COMB);
  for (let y = 4; y <= 11; y += 2) line(r, 4, y, 11, y, COMB_SHADE);
  rect(r, 7, 9, 2, 2, BEE);
  rect(r, 13, 4, 1, 1, BEE);
  rect(r, 2, 11, 1, 1, BEE);
  return outline(r, INK, 1);
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
  for (const [art, raster] of [
    ['scorch', scorch()],
    ['rubble', rubble()],
    ['boards', boards()],
    ['hurdle', hurdle()],
    ['hive', hive()],
  ] as const) {
    frames.push({ name: `fix_${art}_idle_s_0`, raster, ox: 8, oy: 14 });
  }
  frames.push(
    { name: 'fix_rime_closed_s_0', raster: rime(false), ox: 9, oy: 31 },
    { name: 'fix_rime_open_s_0', raster: rime(true), ox: 9, oy: 31 },
  );
  return frames;
}

const ALL: readonly Dir4[] = ['s', 'n', 'w', 'e'];
const one = (frames: number, fps: number): AnimDef => ({ frames, fps, loop: true, dirs: ['s'] });
const all = (frames: number, fps: number, loop = true): AnimDef => ({ frames, fps, loop, dirs: ALL });

export const PASS_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  fx_bragd: { fly: all(2, 12) },
  fix_rime: { closed: one(1, 1), open: one(1, 1) },
  fix_scorch: { idle: one(1, 1) },
  fix_rubble: { idle: one(1, 1) },
  fix_boards: { idle: one(1, 1) },
  fix_hurdle: { idle: one(1, 1) },
  fix_hive: { idle: one(1, 1) },
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
