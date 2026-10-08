import type { Dir4 } from '@core/math/dir';
import type { AnimDef } from '../anims';
import { ellipse, line, rect } from '../draw';
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

// ── Weak floors and stakes (M8b), one tile each: 18 px wide, feet 2 px above the bottom ─────────────────

const SLAB = hex('#5a4e48');
const SLAB_LIGHT = hex('#7a6c62');
const PIT = hex('#120c0a');
const WOOD = hex(C.wood);
const WOOD_SHADE = hex(C.woodShade);

/** A cracked flagstone over a hollow: it rings under the hammer. */
function weakFloor(): Raster {
  const r = createRaster(18, 18);
  rect(r, 1, 3, 16, 14, SLAB);
  rect(r, 1, 3, 16, 1, SLAB_LIGHT);
  line(r, 3, 6, 8, 10, PIT);
  line(r, 8, 10, 6, 15, PIT);
  line(r, 8, 10, 14, 8, PIT);
  line(r, 14, 8, 15, 13, PIT);
  return r;
}

/** The floor broken through: a dark hole with broken edges. */
function brokenFloor(): Raster {
  const r = createRaster(18, 18);
  rect(r, 1, 3, 16, 14, PIT);
  rect(r, 1, 3, 16, 2, SLAB);
  rect(r, 1, 3, 2, 14, SLAB);
  rect(r, 15, 3, 2, 14, SLAB);
  return r;
}

/** A dwarf stake: a squat iron-capped post driven into the floor. */
function stake(): Raster {
  const r = createRaster(18, 18);
  ellipse(r, 9, 15, 6, 2, IRON_DARK);
  rect(r, 5, 4, 8, 11, WOOD);
  rect(r, 10, 4, 3, 11, WOOD_SHADE);
  rect(r, 4, 2, 10, 3, IRON);
  rect(r, 4, 2, 10, 1, IRON_LIGHT);
  return outline(r, INK, 1);
}

/** The stake driven flat: only its iron cap shows. */
function stakeDown(): Raster {
  const r = createRaster(18, 18);
  ellipse(r, 9, 14, 5, 2, IRON);
  ellipse(r, 9, 13.5, 3, 1, IRON_LIGHT);
  return outline(r, INK, 1);
}

// ── Belgr, the bellows construct: 44×44, its feet at (22, 42) ───────────────────────────────────────

const LEATHER = hex('#6a4630');
const LEATHER_SHADE = hex('#4a3020');
const BRASS = hex('#b08a3a');
const MAW = hex('#1a0e0a');
const FLAME = hex('#f8a040');
const FLAME_HOT = hex('#fff0a0');

type BelgrPose = 'idle' | 'step' | 'swell' | 'breathe' | 'draw' | 'reel';

/** A squat iron frame on four stubby legs, a great leather bellows on its back and a brass intake for a face. */
function belgr(side: 's' | 'n' | 'w', pose: BelgrPose, phase: number): Raster {
  const r = createRaster(44, 44);
  const b = pose === 'step' && phase % 2 === 1 ? 1 : 0;
  const swell = pose === 'swell' ? 3 + phase : pose === 'breathe' ? 4 : pose === 'draw' ? 0 : 2;
  const sag = pose === 'reel' ? 3 : 0;
  // Legs.
  for (const x of [8, 15, 25, 32]) rect(r, x, 34 + b, 4, 8 - b, IRON_DARK);
  // The bellows: a leather bag that swells with the breath.
  ellipse(r, 22, 18 + sag, 14 + swell, 10 + swell / 2, LEATHER);
  ellipse(r, 22, 22 + sag, 13 + swell, 5, LEATHER_SHADE);
  for (const y of [14, 19, 24]) rect(r, 10 - swell, y + sag, 24 + 2 * swell, 1, LEATHER_SHADE);
  // The iron frame round it.
  rect(r, 6, 28 + sag, 32, 7, IRON);
  rect(r, 6, 28 + sag, 32, 1, IRON_LIGHT);
  for (const x of [9, 34]) rect(r, x, 30 + sag, 1, 1, RIVET);
  if (side !== 'n') {
    // The intake: a brass ring with a dark maw, gaping while it draws air, flaming as it breathes.
    const cx = side === 's' ? 22 : 10;
    const open = pose === 'draw' || pose === 'reel' ? 5 : 3;
    ellipse(r, cx, 30 + sag, open + 2, open + 1, BRASS);
    ellipse(r, cx, 30 + sag, open, open - 1, pose === 'breathe' ? FLAME : MAW);
    if (pose === 'breathe') ellipse(r, cx, 30 + sag, open - 1.5, open - 2, FLAME_HOT);
  }
  if (pose === 'reel') for (const x of [12, 30]) line(r, x, 26, x + 3, 33, MAW);
  return outline(r, INK, 1);
}

// ── Ívaldi, the Anvil: 40×50, his feet at (20, 48) ──────────────────────────────────────────────────

const PLATE = hex('#5a5a66');
const PLATE_LIGHT = hex('#8a8a98');
const PLATE_HOT = hex('#f8e8c0');
const PLATE_HOT_SHADE = hex('#f0a050');
const BEARD = hex('#c8c0b0');
const CROWN = hex('#d8b040');
const HAFT = hex('#5a3a22');

type IvaldiPose = 'idle' | 'step' | 'raise' | 'slam' | 'stuck' | 'open' | 'fallen' | 'roar';

/** A broad dwarf king in plate, a long white beard, an iron crown, and a hammer as long as he is tall. */
function ivaldi(side: 's' | 'n' | 'w', pose: IvaldiPose, phase: number, hot: boolean): Raster {
  const r = createRaster(40, 50);
  const plate = hot ? PLATE_HOT : PLATE;
  const light = hot ? hex('#ffffff') : PLATE_LIGHT;
  const shade = hot ? PLATE_HOT_SHADE : IRON_DARK;
  if (pose === 'fallen') {
    // Flat on his back, the hammer beside him.
    rect(r, 4, 36, 30, 10, plate);
    rect(r, 4, 36, 30, 2, light);
    ellipse(r, 32, 40, 5, 5, BEARD);
    rect(r, 3, 46, 33, 1, shade);
    rect(r, 6, 30, 20, 3, HAFT);
    rect(r, 3, 27, 8, 8, IRON_DARK);
    return outline(r, INK, 1);
  }
  const b = pose === 'step' && phase % 2 === 1 ? 1 : 0;
  const open = pose === 'open' ? 1 : 0;
  // Legs.
  rect(r, 12, 38 + b, 6, 10 - b, shade);
  rect(r, 22, 38 - b, 6, 10 + b, shade);
  // The plated trunk, broad as a door; a plate hangs loose while he stands open.
  rect(r, 8, 20, 24, 19, plate);
  rect(r, 8, 20, 24, 2, light);
  rect(r, 8, 30, 24, 1, shade);
  if (open === 1) rect(r, 10, 24, 7, 6, shade);
  // Head, beard and crown.
  rect(r, 14, 9, 12, 10, hex('#c9a080'));
  if (side !== 'n') {
    ellipse(r, 20, 20, 7, 6, BEARD);
    rect(r, 16, 12, 2, 2, INK);
    rect(r, 22, 12, 2, 2, INK);
  } else rect(r, 14, 9, 12, 10, BEARD);
  rect(r, 13, 6, 14, 3, CROWN);
  for (const x of [14, 19, 24]) rect(r, x, 4, 2, 2, CROWN);
  // The hammer: raised overhead, slammed down ahead, or stuck in the floor.
  if (pose === 'raise' || pose === 'roar') {
    rect(r, 30, 4, 3, 20, HAFT);
    rect(r, 26, 2, 11, 7, IRON_DARK);
  } else if (pose === 'slam' || pose === 'stuck') {
    rect(r, 30, 30, 3, 12, HAFT);
    rect(r, 26, 40, 11, 7, IRON_DARK);
  } else {
    rect(r, 31, 18, 3, 22, HAFT);
    rect(r, 27, 38, 10, 8, IRON_DARK);
  }
  return outline(r, INK, 1);
}

export function forgeFrames(): SpriteFrame[] {
  const out: SpriteFrame[] = [];
  const fixture = (name: string, raster: Raster): void => {
    out.push({ name, raster, ox: 9, oy: raster.h - 3 });
  };
  fixture('fix_crack_floor_closed_s_0', weakFloor());
  fixture('fix_crack_floor_open_s_0', brokenFloor());
  fixture('fix_crack_stake_closed_s_0', stake());
  fixture('fix_crack_stake_open_s_0', stakeDown());
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
    const bg = (anim: string, i: number, r: Raster): void => {
      add('enemy_belgr', anim, side, i, r, 22, 42);
    };
    bg('idle', 0, belgr(side, 'idle', 0));
    for (let i = 0; i < 4; i++) bg('walk', i, belgr(side, 'step', i));
    bg('swell', 0, belgr(side, 'swell', 0));
    bg('swell', 1, belgr(side, 'swell', 2));
    bg('breathe', 0, belgr(side, 'breathe', 0));
    bg('breathe', 1, belgr(side, 'breathe', 1));
    bg('draw', 0, belgr(side, 'draw', 0));
    bg('reel', 0, belgr(side, 'reel', 0));
    const iv = (anim: string, i: number, r: Raster): void => {
      add('enemy_ivaldi', anim, side, i, r, 20, 48);
    };
    iv('idle', 0, ivaldi(side, 'idle', 0, false));
    iv('roar', 0, ivaldi(side, 'roar', 0, false));
    for (let i = 0; i < 4; i++) {
      iv('walk', i, ivaldi(side, 'step', i, false));
      iv('hotwalk', i, ivaldi(side, 'step', i, true));
    }
    iv('raise', 0, ivaldi(side, 'raise', 0, false));
    iv('slam', 0, ivaldi(side, 'slam', 0, false));
    iv('stuck', 0, ivaldi(side, 'stuck', 0, false));
    iv('open', 0, ivaldi(side, 'open', 0, false));
    iv('anvil', 0, ivaldi(side, 'idle', 0, false));
    iv('fallen', 0, ivaldi(side, 'fallen', 0, false));
  }
  return out;
}

const ALL: readonly Dir4[] = ['s', 'n', 'w', 'e'];
const a = (frames: number, fps: number, loop = true): AnimDef => ({ frames, fps, loop, dirs: ALL });
const one = (frames: number, fps: number): AnimDef => ({ frames, fps, loop: true, dirs: ['s'] });

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
  enemy_belgr: {
    idle: a(1, 1),
    walk: a(4, 4),
    swell: a(2, 4),
    breathe: a(2, 10),
    draw: a(1, 1),
    reel: a(1, 1),
  },
  enemy_ivaldi: {
    idle: a(1, 1),
    roar: a(1, 1),
    walk: a(4, 5),
    hotwalk: a(4, 7),
    raise: a(1, 1),
    slam: a(1, 1),
    stuck: a(1, 1),
    open: a(1, 1),
    anvil: a(1, 1),
    fallen: a(1, 1),
  },
  fix_crack_floor: { closed: one(1, 1), open: one(1, 1) },
  fix_crack_stake: { closed: one(1, 1), open: one(1, 1) },
};
