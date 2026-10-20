import type { TerrainId } from '@content/terrain';
import { nextFloat, nextInt } from '@core/math/rng';
import type { Dir4 } from '@core/math/dir';
import { C } from '../palette';
import type { Painter } from '../painter';
import { clip, clods, regionLit, ridges, tufts, type Tones } from '../texture';
import { insideBlob, onBlobEdge } from './blob';

/* Material tones (docs/art-style-guide.md, rule 2). */
const GRASS: Tones = { base: C.grass, shade: C.grassShade, light: C.grassLight };
const TURF: Tones = { base: C.turf, shade: C.turfShade, light: C.turfLight };
const DIRT: Tones = { base: C.dirt, shade: C.dirtShade, light: C.dirtLight };
const ROCK: Tones = { base: C.rock, shade: C.rockShade, light: C.rockLight };
const WOOD: Tones = { base: C.wood, shade: C.woodShade, light: C.woodLight };
const DARK_WOOD: Tones = { base: C.woodShade, shade: C.ink, light: C.wood };
const FLOOR: Tones = { base: C.floor, shade: C.floorShade, light: C.floorLight };
const CAVE: Tones = { base: C.caveFloorShade, shade: '#3e3630', light: C.caveFloorLight };
const CAVE_WALL: Tones = { base: C.caveWall, shade: C.caveWallShade, light: C.caveWallLight };
const MUD: Tones = { base: C.mud, shade: C.mudShade, light: C.mudLight };

/** The interior of a blob region: inside it and off its edge ring. */
const interior =
  (mask: number, inset: number) =>
  (x: number, y: number): boolean =>
    insideBlob(mask, x, y, inset) && !onBlobEdge(mask, x, y, inset);

export interface TerrainArt {
  readonly autotile: boolean;
  /** Plain variants (ignored for auto-tiled terrain, which always has 47). */
  readonly variants: number;
  /** Animation frames per variant (default 1) and how long each shows. */
  readonly frames?: number;
  readonly frameMs?: number;
  /**
   * Terrains in the same group count as the same terrain when auto-tiling, so water meets the ford or a
   * jetty without a bank, and a chimney does not break up its roof. Defaults to the terrain itself.
   */
  readonly group?: string;
  paint(p: Painter, v: { readonly mask: number; readonly variant: number; readonly frame: number }): void;
}

function grass(p: Painter): void {
  p.fill(C.grass);
  tufts(p, GRASS, 4, 0.6);
}

/**
 * Dry-stone courses inside a blob: a joint every fourth row, uprights staggered per course, and a light
 * pixel on each stone's upper-left corner (rule 5).
 */
function courses(p: Painter, mask: number, inset: number, t: Tones): void {
  const inside = interior(mask, inset);
  for (let y = 0; y < 16; y++) {
    const course = Math.floor(y / 4);
    for (let x = 0; x < 16; x++) {
      if (!inside(x, y)) continue;
      const upright = (x + course * 2) % 5 === 4;
      if (y % 4 === 3 || upright) p.px(x, y, t.shade);
      else if (y % 4 === 0 && (x + course * 2) % 5 === 0) p.px(x, y, t.light);
    }
  }
}

/** A raised blob of stone (rock, a wall, a cairn's foot): lit rim, courses inside, `edge` on the shaded side. */
function stone(p: Painter, mask: number, inset: number, t: Tones, edge = t.shade): void {
  regionLit(p, mask, inset, { ...t, shade: edge, relief: 'raised' });
  courses(p, mask, inset, t);
}

/**
 * Running water: short light dashes on two rows per tile that drift 2 px south per frame, so four frames
 * loop seamlessly. The row offsets come from the painter's rng, which is the same for every frame.
 */
function flow(p: Painter, mask: number, frame: number, inset: number, colour: string): void {
  for (let k = 0; k < 2; k++) {
    const x0 = nextInt(p.rng, 0, 7);
    const y = (k * 8 + 3 + frame * 2) % 16;
    for (let x = x0; x < 16; x += 8)
      for (let i = 0; i < 3 && x + i < 16; i++)
        if (insideBlob(mask, x + i, y, inset) && !onBlobEdge(mask, x + i, y, inset)) p.px(x + i, y, colour);
  }
}

/**
 * A turf roof seen from above: a lit ridge-side edge, an ink eave, thatch courses every fourth row and
 * tufts of turf between them (rule 5).
 */
function roof(p: Painter, mask: number): void {
  grass(p);
  regionLit(p, mask, 0, { base: C.turfShade, shade: C.ink, light: C.turfLight, relief: 'raised' });
  const inside = interior(mask, 0);
  for (let y = 2; y < 16; y += 4)
    for (let x = 0; x < 16; x++) if (inside(x, y) && (x + y) % 5 !== 0) p.px(x, y, C.leafShade);
  tufts(clip(p, inside), { base: C.turf, shade: C.leafShade, light: C.turf }, 5, 0.5);
}

/** The ground under a decor sprite: grass, a little darker where the thing stands. */
function groundBase(p: Painter): void {
  p.fill(C.grass);
  tufts(p, { base: C.grass, shade: C.grassShade, light: C.grass }, 3, 0.7);
}

/** The floor under indoor decor. */
function floorBase(p: Painter): void {
  floor(p);
}

/** Grass on top, a short earth bank below: reads as "you can drop down here". */
function ledge(p: Painter): void {
  grass(p);
  p.rect(0, 10, 16, 1, C.ink);
  p.rect(0, 11, 16, 5, C.dirtShade);
  clods(
    clip(p, (_x, y) => y > 10),
    { base: C.dirt, shade: C.dirtShade, light: C.dirtLight },
    3,
    3,
  );
  p.rect(0, 15, 16, 1, C.dirtShade);
}

/** Rótarhellir's floor: packed dark earth with grit and a few stones. */
function caveFloor(p: Painter): void {
  p.fill(C.caveFloor);
  clods(p, CAVE, 3, 3);
  p.speckle(C.caveFloorShade, 0.05);
}

/** Boards four px wide: a lit edge on each board's top or left, a shade joint, and a knot now and then. */
function planks(p: Painter, t: Tones, vertical: boolean): void {
  p.fill(t.base);
  for (let i = 0; i < 16; i += 4) {
    if (vertical) {
      p.rect(i, 0, 1, 16, t.light);
      p.rect(i + 3, 0, 1, 16, t.shade);
    } else {
      p.rect(0, i, 16, 1, t.light);
      p.rect(0, i + 3, 16, 1, t.shade);
    }
  }
  const kx = nextInt(p.rng, 1, 14);
  const ky = nextInt(p.rng, 1, 14);
  if (vertical) p.rect(kx - (kx % 4) + 1, ky, 2, 1, t.shade);
  else p.rect(kx, ky - (ky % 4) + 1, 1, 2, t.shade);
}

function floor(p: Painter): void {
  planks(p, FLOOR, false);
}

/** Fen ground: dark peat, tussocks and black water in the hollows. */
function bog(p: Painter, variant: number): void {
  p.fill('#4a5236');
  tufts(p, { base: '#4a5236', shade: '#3a4029', light: '#6a7a44' }, 4, 0.6);
  const pools: ReadonlyArray<readonly [number, number, number]> = [
    [3, 4, 3],
    [10, 11, 4],
    [11, 3, 2],
    [4, 12, 2],
  ];
  const [x, y, w] = pools[variant % pools.length] ?? [3, 4, 3];
  p.rect(x, y, w, 2, '#262c24');
  p.rect(x + 1, y, Math.max(1, w - 2), 1, '#3e4a48');
}

/** The troll wood's moss: deep green, lumpy, with a few pale sprigs. */
function moss(p: Painter): void {
  p.fill('#355a2c');
  tufts(p, { base: '#355a2c', shade: '#26441f', light: '#4f7a3a' }, 3, 0.55);
  if (nextFloat(p.rng) < 0.5) p.px(nextInt(p.rng, 0, 16), nextInt(p.rng, 0, 16), '#8aa860');
}

/** Pale shore sand: soft ridges and a pebble or two. */
function sand(p: Painter): void {
  p.fill('#d6c48f');
  ridges(p, { base: '#d6c48f', shade: '#b8a36e', light: '#eee0b0' }, 3, 7);
  clods(p, { base: '#c4b07c', shade: '#a89560', light: '#efe3b6' }, 1, 2);
}

/** Terrain added for the deep wood (M2c): the fen, the glade and the troll wood. */
const DEEP_WOOD = {
  bog: {
    autotile: false,
    variants: 4,
    paint: (p, v) => {
      bog(p, v.variant);
    },
  },
  reeds: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      bog(p, 1);
    },
  },
  birch: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      groundBase(p);
    },
  },
  moss: {
    autotile: false,
    variants: 4,
    paint: (p) => {
      moss(p);
    },
  },
  boulder: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      moss(p);
      p.speckle('#1f3419', 0.2);
    },
  },
} as const satisfies Partial<Record<TerrainId, TerrainArt>>;

/** Mýrland's waters: white rapids, steaming warm springs, and gravel shoals across the river. */
const MYRLAND_WATERS = {
  rapids: {
    autotile: true,
    variants: 0,
    frames: 4,
    frameMs: 90,
    group: 'water',
    paint: (p, v) => {
      grass(p);
      regionLit(p, v.mask, 3, {
        base: C.waterShade,
        shade: C.water,
        light: C.foam,
        relief: 'sunken',
        speck: C.water,
        density: 0.2,
      });
      flow(p, v.mask, v.frame, 3, C.foam);
      flow(p, v.mask, (v.frame + 2) % 4, 3, C.waterLight);
    },
  },
  spring: {
    autotile: true,
    variants: 0,
    frames: 4,
    frameMs: 240,
    group: 'water',
    paint: (p, v) => {
      grass(p);
      regionLit(p, v.mask, 3, {
        base: C.spring,
        shade: C.springShade,
        light: C.springLight,
        relief: 'sunken',
        speck: C.springShade,
        density: 0.1,
      });
      // Bubbles rising: one pixel per tile that climbs a row each frame.
      const bx = nextInt(p.rng, 5, 11);
      const by = 12 - v.frame * 2;
      if (insideBlob(v.mask, bx, by, 4)) p.px(bx, by, C.springLight);
    },
  },
  shoal: {
    autotile: true,
    variants: 0,
    frames: 4,
    frameMs: 150,
    group: 'water',
    paint: (p, v) => {
      grass(p);
      regionLit(p, v.mask, 2, {
        base: C.waterLight,
        shade: C.water,
        light: C.foam,
        relief: 'sunken',
        speck: C.rock,
        density: 0.16,
      });
      flow(p, v.mask, v.frame, 2, C.rockLight);
    },
  },
  /** Cut peat: black-brown turves with the spade's straight cuts. */
  peat: {
    autotile: false,
    variants: 3,
    paint: (p, v) => {
      p.fill(C.mudShade);
      clods(p, { base: C.mud, shade: '#2e231a', light: C.mudLight }, 3, 3);
      p.rect(0, 4 + v.variant * 3, 16, 1, '#2e231a');
      p.rect(3 + v.variant * 4, 0, 1, 16, '#2e231a');
    },
  },
  /** Still millpond water under the drowned mill (its sprite stands on top). */
  mill: {
    autotile: false,
    variants: 1,
    group: 'water',
    paint: (p) => {
      p.fill(C.waterShade);
      p.speckle(C.water, 0.2);
    },
  },
  /** Water under the moored boat. */
  boat: {
    autotile: false,
    variants: 1,
    group: 'water',
    paint: (p) => {
      p.fill(C.water);
      p.speckle(C.waterShade, 0.15);
    },
  },
} as const satisfies Partial<Record<TerrainId, TerrainArt>>;

/**
 * Sökkva Kvern's rising water, drawn as at the lowest level: dry sluice floors of wet flagstones, and race
 * channels with their planks lying on the bottom. The water and the floated planks are an overlay.
 */
/** Flagstones: two courses with staggered joints, a light pixel on each stone's upper-left corner. */
function flags(p: Painter, fill: string, joint: string, variant: number, light?: string): void {
  p.fill(fill);
  const row = 7 + (variant % 2);
  const ux0 = 5 + variant * 3;
  const ux1 = 11 - variant * 2;
  p.rect(0, row, 16, 1, joint);
  p.rect(ux0, 0, 1, row, joint);
  p.rect(ux1, row, 1, 16 - row, joint);
  if (light !== undefined) {
    p.px(ux0 + 1, 0, light);
    p.px(0, row + 1, light);
    p.px(ux1 + 1, row + 1, light);
  }
  const cx = nextInt(p.rng, 0, 14);
  const cy = nextInt(p.rng, 0, 14);
  p.rect(cx, cy, 2, 1, joint);
}

function channel(p: Painter, deep: boolean): void {
  p.fill(deep ? C.ink : C.caveWall);
  p.speckle(C.mudShade, 0.2);
  // Planks on the bottom, askew.
  p.rect(2, 5, 12, 2, C.woodShade);
  p.rect(3, 10, 11, 2, C.woodShade);
  p.rect(0, 0, 16, 1, C.rockShade);
  p.rect(0, 15, 16, 1, C.rockShade);
}

const MILL_WATERS = {
  sluice: {
    autotile: false,
    variants: 2,
    paint: (p, v) => {
      flags(p, C.rockShade, C.ink, v.variant, C.rock);
    },
  },
  sluice_hi: {
    autotile: false,
    variants: 2,
    paint: (p, v) => {
      flags(p, C.rock, C.rockShade, v.variant, C.rockLight);
    },
  },
  race: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      channel(p, false);
    },
  },
  race_hi: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      channel(p, true);
    },
  },
  /** Old wet boards, dark with the water that stood over them. */
  boards: {
    autotile: false,
    variants: 2,
    paint: (p, v) => {
      planks(p, DARK_WOOD, v.variant === 1);
      p.speckle(C.mudShade, 0.06);
    },
  },
  /** Dressed stone below, black timber above: the mill's walls, auto-tiled like the cave's. */
  mill_wall: {
    autotile: true,
    variants: 0,
    paint: (p, v) => {
      planks(p, DARK_WOOD, false);
      stone(p, v.mask, 0, { base: C.rockShade, shade: '#3f434a', light: C.rock }, C.ink);
    },
  },
  /** Grey silt: the millpond's bottom. */
  silt: {
    autotile: false,
    variants: 3,
    paint: (p, v) => {
      p.fill(C.mud);
      ridges(p, MUD, 2, 6);
      p.rect(2 + v.variant * 4, 6 + v.variant * 3, 4, 1, C.mudShade);
    },
  },
} as const satisfies Partial<Record<TerrainId, TerrainArt>>;

/** Heather: grass gone purple-brown, with sprigs of bloom. */
function heath(p: Painter): void {
  p.fill('#6f6a44');
  tufts(p, { base: '#6f6a44', shade: '#57533a', light: '#8a8560' }, 4, 0.5);
  tufts(p, { base: '#6f6a44', shade: '#8a5a7a', light: '#b07aa0' }, 6, 0.6);
}

/** Terrain added for Haugar (M4a): heather, grave-hills, cairns, paving and dry-stone walls. */
const HAUGAR = {
  heath: {
    autotile: false,
    variants: 4,
    paint: (p) => {
      heath(p);
    },
  },
  /** A grave-hill's flank: turf over the mound, a pale rim where it meets the ground. */
  barrow: {
    autotile: true,
    variants: 0,
    paint: (p, v) => {
      heath(p);
      regionLit(p, v.mask, 1, { ...TURF, relief: 'raised' });
      tufts(clip(p, interior(v.mask, 1)), TURF, 4, 0.5);
    },
  },
  cairn: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      heath(p);
    },
  },
  flagstone: {
    autotile: false,
    variants: 3,
    paint: (p, v) => {
      flags(p, C.rock, C.rockShade, v.variant, C.rockLight);
      p.speckle('#8a9a5a', 0.03);
    },
  },
  drystone: {
    autotile: true,
    variants: 0,
    paint: (p, v) => {
      heath(p);
      stone(p, v.mask, 1, { base: C.rockShade, shade: '#44484f', light: C.rock }, C.ink);
    },
  },
  tent: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      heath(p);
    },
  },
} as const satisfies Partial<Record<TerrainId, TerrainArt>>;

/** Konungshaugr's floor: grey flags with dark seams and grave-dust. */
function cryptFloor(p: Painter, variant: number): void {
  flags(p, '#5a5550', '#3a3632', variant, '#6e6860');
  p.speckle('#4a4540', 0.04);
}

/** A pit: black depths inside a crumbling rim of floor. Ghost floor is drawn the same, joined to it. */
function pit(p: Painter, mask: number): void {
  cryptFloor(p, 0);
  regionLit(p, mask, 2, {
    base: '#0c0a0c',
    shade: '#060506',
    light: '#2a2522',
    relief: 'sunken',
    speck: '#141014',
    density: 0.2,
  });
}

/** Terrain added for Konungshaugr (M4b). */
const KONUNGSHAUGR = {
  crypt_floor: {
    autotile: false,
    variants: 3,
    paint: (p, v) => {
      cryptFloor(p, v.variant);
    },
  },
  crypt_wall: {
    autotile: true,
    variants: 0,
    paint: (p, v) => {
      cryptFloor(p, 1);
      stone(p, v.mask, 0, { base: '#3a3230', shade: '#2a2422', light: '#4e4440' }, C.ink);
    },
  },
  pit: {
    autotile: true,
    variants: 0,
    group: 'pit',
    paint: (p, v) => {
      pit(p, v.mask);
    },
  },
  ghost: {
    autotile: true,
    variants: 0,
    group: 'pit',
    paint: (p, v) => {
      pit(p, v.mask);
    },
  },
} as const satisfies Partial<Record<TerrainId, TerrainArt>>;

/** Niflmýrr's grey sedge over sodden peat. */
function mire(p: Painter): void {
  p.fill('#4e5a4c');
  tufts(p, { base: '#4e5a4c', shade: '#3c463b', light: '#6c7a64' }, 4, 0.6);
  if (nextFloat(p.rng) < 0.4) p.px(nextInt(p.rng, 0, 16), nextInt(p.rng, 0, 16), '#8e9a84');
}

/** Niflmýrr (M6a): the sedge mire, black pools that never freeze, and the ground under a dead tree. */
/** Niflmýrr's still black pools (and the drowned path that hides under them). */
const BLACKWATER: TerrainArt = {
  autotile: true,
  variants: 0,
  frames: 4,
  frameMs: 400,
  group: 'water',
  paint: (p, v) => {
    mire(p);
    regionLit(p, v.mask, 3, {
      base: '#1c2224',
      shade: '#121618',
      light: '#3a4642',
      relief: 'sunken',
      speck: '#283032',
      density: 0.12,
    });
    // A slow glint sliding across the still surface.
    const gx = (nextInt(p.rng, 2, 9) + v.frame * 2) % 16;
    const gy = nextInt(p.rng, 5, 11);
    if (insideBlob(v.mask, gx, gy, 4)) p.rect(gx, gy, 2, 1, '#5a6a68');
  },
};

const NIFLMYRR = {
  mire: {
    autotile: false,
    variants: 4,
    paint: (p) => {
      mire(p);
    },
  },
  blackwater: BLACKWATER,
  /** Drawn as the black water it runs under: only light shows it. */
  drowned_path: BLACKWATER,

  snag: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      mire(p);
      p.speckle('#3c463b', 0.22);
    },
  },
} as const satisfies Partial<Record<TerrainId, TerrainArt>>;

/** Streaks of foam sliding the way a current runs, `step` px a frame (a surge's are longer and quicker). */
function streaks(p: Painter, frame: number, dir: Dir4, colour: string, len: number, step: number): void {
  const across = dir === 'e' || dir === 'w';
  const sign = dir === 'e' || dir === 's' ? 1 : -1;
  for (let k = 0; k < 2; k++) {
    const lane = k * 8 + 2 + nextInt(p.rng, 0, 3);
    const head = (((nextInt(p.rng, 0, 15) + sign * frame * step) % 16) + 16) % 16;
    for (let i = 0; i < len; i++) {
      const a = (((head - sign * i) % 16) + 16) % 16;
      p.px(across ? a : lane, across ? lane : a, colour);
    }
  }
}

/**
 * Running lake water, drawn whole (it always lies inside open water, which runs into it with no bank):
 * a current slides pale streaks along; a surge is darker, with longer, quicker foam.
 */
function current(dir: Dir4, strong: boolean): TerrainArt {
  return {
    autotile: false,
    variants: 1,
    frames: 4,
    frameMs: strong ? 80 : 160,
    group: 'water',
    paint: (p, v) => {
      p.fill(strong ? C.waterShade : C.water);
      p.speckle(C.waterLight, 0.05);
      streaks(p, v.frame, dir, strong ? C.foam : C.waterLight, strong ? 5 : 3, strong ? 4 : 2);
    },
  };
}

/** Sævatn's running water: currents a swimmer rides, and surges only a diver crosses. */
const SAEVATN = {
  current_n: current('n', false),
  current_e: current('e', false),
  current_s: current('s', false),
  current_w: current('w', false),
  surge_n: current('n', true),
  surge_e: current('e', true),
  surge_s: current('s', true),
  surge_w: current('w', true),
} as const satisfies Partial<Record<TerrainId, TerrainArt>>;

/** Sökkva Hof's drowned stone: green-grey flagstones that the water rises over, and arches over the deep. */
const SOKKVA_HOF = {
  hof_floor: {
    autotile: false,
    variants: 2,
    paint: (p, v) => {
      flags(p, '#4a5a56', '#2a3634', v.variant);
    },
  },
  hof_floor_hi: {
    autotile: false,
    variants: 2,
    paint: (p, v) => {
      flags(p, '#5e6e68', '#3a4844', v.variant);
    },
  },
  arch: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      p.fill(C.waterShade);
      p.speckle(C.waterLight, 0.04);
      // The lintel's dressed stones, with a dark gap of water showing beneath.
      p.rect(0, 1, 16, 9, '#46545a');
      p.rect(0, 1, 16, 1, '#6c7e84');
      p.rect(5, 1, 1, 9, '#28323a');
      p.rect(11, 1, 1, 9, '#28323a');
      p.rect(0, 10, 16, 2, C.ink);
    },
  },
} as const satisfies Partial<Record<TerrainId, TerrainArt>>;

/** A conveyor belt: dark slats crossing the way it runs, sliding along one px a frame. */
function belt(dir: Dir4): TerrainArt {
  const across = dir === 'e' || dir === 'w';
  const sign = dir === 'e' || dir === 's' ? 1 : -1;
  return {
    autotile: false,
    variants: 1,
    frames: 4,
    frameMs: 120,
    paint: (p, v) => {
      p.fill('#3a3634');
      for (let k = 0; k < 4; k++) {
        const a = (((k * 4 + sign * v.frame) % 16) + 16) % 16;
        if (across) p.rect(a, 1, 1, 14, '#5c5652');
        else p.rect(1, a, 14, 1, '#5c5652');
      }
      // The rails along both edges.
      if (across) {
        p.rect(0, 0, 16, 1, '#1c1a1a');
        p.rect(0, 15, 16, 1, '#1c1a1a');
      } else {
        p.rect(0, 0, 1, 16, '#1c1a1a');
        p.rect(15, 0, 1, 16, '#1c1a1a');
      }
    },
  };
}

/** Dvergagröf's scree and Ívaldi's Forge: basalt, iron flags, lava and the belts. */
const DVERGAGROF = {
  scree: {
    autotile: false,
    variants: 4,
    paint: (p) => {
      p.fill('#7a7672');
      clods(p, { base: '#68645f', shade: '#54504c', light: '#9a9690' }, 5, 4);
    },
  },
  forge_floor: {
    autotile: false,
    variants: 2,
    paint: (p, v) => {
      flags(p, '#4a4442', '#2c2826', v.variant);
    },
  },
  forge_wall: {
    autotile: false,
    variants: 2,
    paint: (p) => {
      p.fill('#262224');
      p.speckle('#3a3436', 0.25);
      p.rect(0, 12, 16, 4, '#18161a');
    },
  },
  lava: {
    autotile: false,
    variants: 1,
    frames: 4,
    frameMs: 200,
    paint: (p, v) => {
      p.fill('#c4421a');
      p.speckle('#e0702a', 0.2);
      for (let k = 0; k < 3; k++) {
        const x = (nextInt(p.rng, 0, 15) + v.frame * 2) % 16;
        const y = nextInt(p.rng, 1, 14);
        p.rect(x, y, Math.min(3, 16 - x), 1, '#f8c04a');
      }
      p.speckle('#7a2410', 0.06);
    },
  },
  belt_n: belt('n'),
  belt_e: belt('e'),
  belt_s: belt('s'),
  belt_w: belt('w'),
} as const satisfies Partial<Record<TerrainId, TerrainArt>>;

/** Hrímfjöll's firn, glaze and rime cliffs, and Hrímturn's frosted glass (M9). */
const HRIMFJOLL = {
  firn: {
    autotile: false,
    variants: 4,
    paint: (p) => {
      p.fill('#e4ecf2');
      ridges(p, { base: '#e4ecf2', shade: '#c8d6e2', light: '#ffffff' }, 3, 7);
    },
  },
  glaze: {
    autotile: false,
    variants: 2,
    paint: (p, v) => {
      p.fill('#9cc8e4');
      p.speckle('#b8dcf0', 0.12);
      // Long glints across the ice, so a slide reads before it starts.
      p.rect(1 + v.variant * 4, 3, 7, 1, '#e8f6ff');
      p.rect(8 - v.variant * 3, 10, 6, 1, '#d4ecfa');
      p.rect(0, 15, 16, 1, '#86b4d4');
    },
  },
  rime: {
    autotile: true,
    variants: 0,
    paint: (p, v) => {
      p.fill('#e4ecf2');
      regionLit(p, v.mask, 0, {
        base: '#5e7e9c',
        shade: '#46627e',
        light: '#c8dcec',
        relief: 'raised',
      });
      clip(p, interior(v.mask, 1)).speckle('#7898b6', 0.25);
    },
  },
  tower_floor: {
    autotile: false,
    variants: 2,
    paint: (p, v) => {
      flags(p, '#b4c8da', '#90a8c0', v.variant);
      p.speckle('#e0eef8', 0.06);
    },
  },
  tower_wall: {
    autotile: false,
    variants: 2,
    paint: (p) => {
      p.fill('#3e5672');
      p.speckle('#567090', 0.25);
      p.rect(0, 12, 16, 4, '#2c3e56');
      p.rect(3, 2, 1, 8, '#8eaecc');
    },
  },
  clear_ice: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      p.fill('#c4e4f6');
      p.speckle('#e8f6ff', 0.15);
      p.rect(2, 2, 1, 10, '#ffffff');
      p.rect(4, 1, 1, 5, '#f0faff');
      p.rect(0, 13, 16, 3, '#8cb8d6');
    },
  },
  giant_floor: {
    autotile: false,
    variants: 2,
    paint: (p, v) => {
      // One great flag per tile pair: a seam every other tile, so the floor reads as giant-sized.
      p.fill('#8a96a4');
      p.speckle('#9ca8b4', 0.2);
      p.speckle('#d8e4ee', 0.04);
      if (v.variant === 0) p.rect(0, 15, 16, 1, '#6a7684');
      else p.rect(15, 0, 1, 16, '#6a7684');
    },
  },
  giant_wall: {
    autotile: false,
    variants: 2,
    paint: (p) => {
      p.fill('#4a5462');
      p.speckle('#5e6a7a', 0.25);
      p.rect(0, 7, 16, 1, '#343c48');
      p.rect(0, 12, 16, 4, '#2e3540');
      p.rect(1, 1, 6, 1, '#b8d0e4');
    },
  },
} as const satisfies Partial<Record<TerrainId, TerrainArt>>;

export const TERRAIN_ART: Readonly<Record<TerrainId, TerrainArt>> = {
  ...HRIMFJOLL,
  ...DVERGAGROF,
  ...SOKKVA_HOF,
  ...SAEVATN,
  ...NIFLMYRR,
  ...DEEP_WOOD,
  ...KONUNGSHAUGR,
  ...HAUGAR,
  ...MYRLAND_WATERS,
  ...MILL_WATERS,
  grass: {
    autotile: false,
    variants: 4,
    paint: (p) => {
      grass(p);
    },
  },
  /** Worn earth: drawn whole, and the ground around it spills its own fringe over the edge (rule 4). */
  path: {
    autotile: false,
    variants: 4,
    paint: (p) => {
      p.fill(C.dirt);
      clods(p, { base: C.dirtShade, shade: C.dirtShade, light: C.dirtLight }, 3, 3);
      p.speckle(C.dirtShade, 0.03);
    },
  },
  water: {
    autotile: true,
    variants: 0,
    frames: 4,
    frameMs: 150,
    group: 'water',
    paint: (p, v) => {
      grass(p);
      regionLit(p, v.mask, 3, {
        base: C.water,
        shade: C.waterShade,
        light: C.waterLight,
        relief: 'sunken',
        speck: C.waterShade,
        density: 0.08,
      });
      flow(p, v.mask, v.frame, 3, C.waterLight);
    },
  },
  rock: {
    autotile: true,
    variants: 0,
    paint: (p, v) => {
      grass(p);
      stone(p, v.mask, 1, ROCK);
    },
  },
  tree: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      groundBase(p);
    },
  },
  ledge: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      ledge(p);
    },
  },
  fence: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      grass(p);
      p.rect(0, 5, 16, 1, C.woodLight);
      p.rect(0, 6, 16, 1, C.wood);
      p.rect(0, 7, 16, 1, C.woodShade);
      p.rect(0, 10, 16, 1, C.woodLight);
      p.rect(0, 11, 16, 1, C.wood);
      p.rect(0, 12, 16, 1, C.woodShade);
      for (const x of [2, 11]) {
        p.rect(x, 2, 3, 13, C.wood);
        p.rect(x, 3, 1, 12, C.woodLight);
        p.rect(x + 2, 2, 1, 13, C.woodShade);
        p.rect(x, 2, 3, 1, C.ink);
      }
    },
  },
  field: {
    autotile: false,
    variants: 3,
    paint: (p, v) => {
      p.fill(C.barley);
      for (let x = v.variant % 3; x < 16; x += 3) {
        p.rect(x, 3, 1, 13, C.barleyShade);
        p.px(x, 2, C.barleyLight);
        p.px(x, 3, C.barleyLight);
      }
      p.speckle(C.barleyLight, 0.04);
    },
  },
  yard: {
    autotile: false,
    variants: 4,
    paint: (p) => {
      p.fill(C.dirtShade);
      clods(p, DIRT, 3, 2);
      p.speckle('#7a5a38', 0.04);
    },
  },
  roof: {
    autotile: true,
    variants: 0,
    group: 'roof',
    paint: (p, v) => {
      roof(p, v.mask);
    },
  },
  wall: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      planks(p, WOOD, true);
      p.rect(0, 0, 16, 2, C.ink);
      p.rect(0, 2, 16, 1, C.woodLight);
      p.rect(0, 13, 16, 3, C.woodShade);
    },
  },
  door: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      planks(p, WOOD, true);
      p.rect(0, 0, 16, 2, C.ink);
      p.rect(1, 2, 14, 1, C.woodShade);
      p.rect(2, 3, 12, 13, C.woodShade);
      p.rect(3, 4, 10, 12, C.ink);
    },
  },
  floor: {
    autotile: false,
    variants: 2,
    paint: (p) => {
      floor(p);
    },
  },
  wall_int: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      planks(p, DARK_WOOD, true);
      p.rect(0, 0, 16, 1, C.wood);
      p.rect(0, 12, 16, 4, C.floorShade);
      p.rect(0, 12, 16, 1, C.ink);
    },
  },
  void: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      p.fill(C.ink);
    },
  },
  ford: {
    autotile: true,
    variants: 0,
    frames: 4,
    frameMs: 150,
    group: 'water',
    paint: (p, v) => {
      grass(p);
      regionLit(p, v.mask, 2, {
        base: C.waterLight,
        shade: C.water,
        light: C.foam,
        relief: 'sunken',
        speck: C.rockLight,
        density: 0.08,
      });
      flow(p, v.mask, v.frame, 2, C.rockLight);
    },
  },
  well: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      groundBase(p);
    },
  },
  trough: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      groundBase(p);
    },
  },
  stump: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      groundBase(p);
    },
  },
  bed: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      floorBase(p);
    },
  },
  hearth: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      floorBase(p);
    },
  },
  table: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      floorBase(p);
    },
  },
  menhir: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      groundBase(p);
    },
  },
  door_shut: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      planks(p, WOOD, true);
      p.rect(0, 0, 16, 2, C.ink);
      p.rect(1, 2, 14, 1, C.woodShade);
      p.rect(2, 3, 12, 13, C.ink);
      p.rect(3, 4, 10, 12, C.wood);
      for (const x of [5, 8, 11]) p.rect(x, 4, 1, 12, C.woodShade);
      p.rect(3, 5, 2, 1, C.rockShade);
      p.rect(3, 12, 2, 1, C.rockShade);
      p.rect(11, 9, 2, 2, C.steelShade);
    },
  },
  window: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      planks(p, WOOD, true);
      p.rect(0, 0, 16, 2, C.ink);
      p.rect(0, 2, 16, 1, C.woodLight);
      p.rect(0, 13, 16, 3, C.woodShade);
      p.rect(3, 3, 10, 10, C.ink);
      p.rect(4, 4, 8, 8, C.rockShade);
      p.rect(8, 4, 1, 8, C.wood);
      p.rect(4, 8, 8, 1, C.wood);
      p.rect(5, 5, 2, 1, C.rockLight);
      p.px(5, 6, C.rockLight);
      p.rect(3, 13, 10, 1, C.woodShade);
    },
  },
  chimney: {
    autotile: false,
    variants: 1,
    group: 'roof',
    paint: (p) => {
      roof(p, 0xff);
      p.rect(4, 2, 8, 11, C.ink);
      p.rect(5, 3, 6, 9, C.rock);
      p.rect(9, 3, 2, 9, C.rockShade);
      p.rect(5, 3, 6, 2, C.ink);
    },
  },
  jetty: {
    autotile: false,
    variants: 1,
    group: 'water',
    paint: (p) => {
      planks(p, WOOD, false);
      p.rect(0, 0, 16, 1, C.ink);
      p.rect(0, 15, 16, 1, C.ink);
      p.rect(1, 1, 2, 2, C.woodShade);
      p.rect(1, 13, 2, 2, C.woodShade);
    },
  },
  pine: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      groundBase(p);
      clods(p, { base: C.dirtShade, shade: C.dirtShade, light: C.dirt }, 2, 2);
    },
  },
  log: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      groundBase(p);
    },
  },
  mound: {
    autotile: false,
    variants: 2,
    paint: (p) => {
      grass(p);
      for (let y = 3; y < 15; y++) {
        const half = Math.round(7 * Math.sqrt(1 - ((y - 9) / 6.5) ** 2));
        p.rect(8 - half, y, half * 2, 1, y < 7 ? C.dirt : C.dirtShade);
      }
      p.rect(5, 5, 6, 1, C.grassShade);
      p.speckle(C.rockShade, 0.03);
    },
  },
  kiln: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      groundBase(p);
      p.speckle(C.ink, 0.06);
    },
  },
  cave_floor: {
    autotile: false,
    variants: 4,
    paint: (p, v) => {
      caveFloor(p);
      if (v.variant === 3) {
        p.rect(9, 6, 3, 2, C.caveFloorShade);
        p.px(9, 6, C.caveFloorLight);
      }
    },
  },
  cave_wall: {
    autotile: true,
    variants: 0,
    paint: (p, v) => {
      caveFloor(p);
      stone(p, v.mask, 0, CAVE_WALL, C.ink);
    },
  },
  sap: {
    autotile: true,
    variants: 0,
    frames: 4,
    frameMs: 260,
    paint: (p, v) => {
      caveFloor(p);
      regionLit(p, v.mask, 2, {
        base: C.sap,
        shade: C.sapShade,
        light: C.sapLight,
        relief: 'sunken',
        speck: C.sapShade,
        density: 0.1,
      });
      // A bubble rises and pops over four frames at a spot the painter's rng picks per tile.
      const x = nextInt(p.rng, 5, 11);
      const y = nextInt(p.rng, 5, 11);
      if (insideBlob(v.mask, x, y, 3) && v.frame < 3) {
        p.px(x, y - v.frame, C.sapLight);
        if (v.frame === 2) p.px(x + 1, y - v.frame, C.sapLight);
      }
    },
  },
  roots: {
    autotile: true,
    variants: 0,
    paint: (p, v) => {
      caveFloor(p);
      regionLit(p, v.mask, 0, {
        base: C.rootShade,
        shade: C.ink,
        light: C.root,
        relief: 'raised',
        speck: C.caveWall,
        density: 0.12,
      });
      for (let k = 0; k < 3; k++) {
        const x0 = nextInt(p.rng, 0, 16);
        for (let y = 0; y < 16; y++) {
          const x = (x0 + Math.floor(y / 3)) % 16;
          if (insideBlob(v.mask, x, y, 1) && !onBlobEdge(v.mask, x, y, 1)) {
            p.px(x, y, C.root);
            if (y % 4 === 0 && insideBlob(v.mask, x + 1, y, 1) && !onBlobEdge(v.mask, x + 1, y, 1))
              p.px(x + 1, y, C.rootLight);
          }
        }
      }
    },
  },
  runestone: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      caveFloor(p);
      p.speckle(C.caveFloorShade, 0.25);
    },
  },
  cave_mouth: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      p.fill(C.rockShade);
      p.speckle(C.rock, 0.1);
      p.rect(3, 1, 10, 15, C.ink);
      p.rect(2, 4, 12, 12, C.ink);
      p.rect(4, 0, 8, 1, C.ink);
    },
  },
  planks: {
    autotile: false,
    variants: 2,
    paint: (p, v) => {
      planks(p, FLOOR, v.variant === 1);
      p.speckle(C.dirtShade, 0.03);
    },
  },
  palisade: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      grass(p);
      for (const x of [0, 4, 8, 12]) {
        p.rect(x, 3, 4, 13, C.wood);
        p.rect(x + 1, 4, 1, 11, C.woodLight);
        p.rect(x + 3, 3, 1, 13, C.woodShade);
        p.rect(x + 1, 1, 2, 2, C.wood);
        p.px(x + 1, 0, C.ink);
        p.px(x + 2, 0, C.ink);
        p.rect(x, 3, 1, 13, C.ink);
      }
      p.rect(0, 9, 16, 1, C.woodShade);
    },
  },
  sand: {
    autotile: false,
    variants: 2,
    paint: (p) => {
      sand(p);
    },
  },
  stall: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      planks(p, FLOOR, false);
    },
  },
  thingstone: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      groundBase(p);
    },
  },
  anvil: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      planks(p, FLOOR, false);
      p.speckle(C.ink, 0.05);
    },
  },
};
