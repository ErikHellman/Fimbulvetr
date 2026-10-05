import type { TerrainId } from '@content/terrain';
import { nextFloat, nextInt } from '@core/math/rng';
import type { Dir4 } from '@core/math/dir';
import { C } from '../palette';
import type { Painter } from '../painter';
import { insideBlob, onBlobEdge } from './blob';

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
  p.speckle(C.grassShade, 0.14);
  p.speckle(C.grassLight, 0.05);
}

function region(
  p: Painter,
  mask: number,
  inset: number,
  fill: string,
  edge: string,
  speck: string,
  density: number,
): void {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (!insideBlob(mask, x, y, inset)) continue;
      if (onBlobEdge(mask, x, y, inset)) p.px(x, y, edge);
      else p.px(x, y, nextFloat(p.rng) < density ? speck : fill);
    }
  }
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

/** A turf roof seen from above: ink edge, leaf-shade stripes every third row. */
function roof(p: Painter, mask: number): void {
  grass(p);
  region(p, mask, 0, C.turfShade, C.ink, C.turf, 0.12);
  for (let y = 1; y < 16; y += 3)
    for (let x = 0; x < 16; x++)
      if (insideBlob(mask, x, y, 0) && !onBlobEdge(mask, x, y, 0) && (x + y) % 4 !== 0)
        p.px(x, y, C.leafShade);
}

/** The ground under a decor sprite: grass with a denser shade speckle as its shadow. */
function groundBase(p: Painter): void {
  grass(p);
  p.speckle(C.grassShade, 0.22);
}

/** The floor under indoor decor. */
function floorBase(p: Painter): void {
  floor(p);
  p.speckle(C.floorShade, 0.22);
}

/** Grass on top, a short earth bank below: reads as "you can drop down here". */
function ledge(p: Painter): void {
  grass(p);
  p.rect(0, 10, 16, 1, C.ink);
  p.rect(0, 11, 16, 5, C.dirtShade);
  p.speckle(C.grassShade, 0.02);
  for (let x = 1; x < 16; x += 4) p.px(x, 13, C.dirt);
}

/** Rótarhellir's floor: packed dark earth with grit. */
function caveFloor(p: Painter): void {
  p.fill(C.caveFloor);
  p.speckle(C.caveFloorShade, 0.16);
  p.speckle(C.caveFloorLight, 0.04);
}

function planks(p: Painter, fill: string, line: string, vertical: boolean): void {
  p.fill(fill);
  p.speckle(line, 0.04);
  for (let i = 3; i < 16; i += 4) {
    if (vertical) p.rect(i, 0, 1, 16, line);
    else p.rect(0, i, 16, 1, line);
  }
}

function floor(p: Painter): void {
  planks(p, C.floor, C.floorShade, false);
}

/** Fen ground: dark peat, tussocks and black water in the hollows. */
function bog(p: Painter, variant: number): void {
  p.fill('#4a5236');
  p.speckle('#3a4029', 0.18);
  p.speckle('#6a7a44', 0.08);
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
  p.speckle('#26441f', 0.2);
  p.speckle('#4f7a3a', 0.08);
  p.speckle('#8aa860', 0.015);
}

/** Pale shore sand. */
function sand(p: Painter): void {
  p.fill('#d6c48f');
  p.speckle('#b8a36e', 0.12);
  p.speckle('#eee0b0', 0.05);
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
      region(p, v.mask, 3, C.waterShade, C.foam, C.water, 0.2);
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
      region(p, v.mask, 3, C.spring, C.springLight, C.springShade, 0.1);
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
      region(p, v.mask, 2, C.waterLight, C.water, C.rock, 0.16);
      flow(p, v.mask, v.frame, 2, C.rockLight);
    },
  },
  /** Cut peat: black-brown turves with the spade's straight cuts. */
  peat: {
    autotile: false,
    variants: 3,
    paint: (p, v) => {
      p.fill(C.mudShade);
      p.speckle(C.mud, 0.18);
      p.speckle('#2e231a', 0.1);
      p.rect(0, 4 + v.variant * 3, 16, 1, '#2e231a');
      p.rect(3 + v.variant * 4, 0, 1, 16, '#2e231a');
    },
  },
  /** Still millpond water under the drowned mill (its sprite stands on top). */
  mill: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      p.fill(C.waterShade);
      p.speckle(C.water, 0.2);
    },
  },
  /** Water under the moored boat. */
  boat: {
    autotile: false,
    variants: 1,
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
function flags(p: Painter, fill: string, joint: string, variant: number): void {
  p.fill(fill);
  p.speckle(C.mudShade, 0.08);
  p.rect(0, 7 + (variant % 2), 16, 1, joint);
  p.rect(5 + variant * 3, 0, 1, 8, joint);
  p.rect(11 - variant * 2, 8, 1, 8, joint);
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
      flags(p, C.rockShade, C.ink, v.variant);
    },
  },
  sluice_hi: {
    autotile: false,
    variants: 2,
    paint: (p, v) => {
      flags(p, C.rock, C.rockShade, v.variant);
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
      planks(p, C.woodShade, C.ink, v.variant === 1);
      p.speckle(C.mudShade, 0.06);
    },
  },
  /** Dressed stone below, black timber above: the mill's walls, auto-tiled like the cave's. */
  mill_wall: {
    autotile: true,
    variants: 0,
    paint: (p, v) => {
      planks(p, C.woodShade, C.ink, false);
      region(p, v.mask, 0, C.rockShade, C.ink, C.rock, 0.12);
    },
  },
  /** Grey silt: the millpond's bottom. */
  silt: {
    autotile: false,
    variants: 3,
    paint: (p, v) => {
      p.fill(C.mud);
      p.speckle(C.mudShade, 0.2);
      p.speckle(C.mudLight, 0.06);
      p.rect(2 + v.variant * 4, 6 + v.variant * 3, 4, 1, C.mudShade);
    },
  },
} as const satisfies Partial<Record<TerrainId, TerrainArt>>;

/** Heather: grass gone purple-brown, with sprigs of bloom. */
function heath(p: Painter): void {
  p.fill('#6f6a44');
  p.speckle('#57533a', 0.2);
  p.speckle('#8a5a7a', 0.1);
  p.speckle('#b07aa0', 0.03);
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
      region(p, v.mask, 1, C.turf, C.turfShade, C.turfLight, 0.14);
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
      p.fill(C.rock);
      p.speckle(C.rockLight, 0.06);
      p.rect(0, 7 + (v.variant % 2), 16, 1, C.rockShade);
      p.rect(5 + v.variant * 3, 0, 1, 8, C.rockShade);
      p.rect((10 + v.variant * 4) % 16, 8, 1, 8, C.rockShade);
      p.speckle('#8a9a5a', 0.03);
    },
  },
  drystone: {
    autotile: true,
    variants: 0,
    paint: (p, v) => {
      heath(p);
      region(p, v.mask, 1, C.rockShade, C.ink, C.rock, 0.3);
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
  p.fill('#5a5550');
  p.speckle('#4a4540', 0.16);
  p.speckle('#6e6860', 0.06);
  p.rect(0, 7 + (variant % 2), 16, 1, '#3a3632');
  p.rect(4 + variant * 4, 0, 1, 8, '#3a3632');
  p.rect((9 + variant * 5) % 16, 8, 1, 8, '#3a3632');
}

/** A pit: black depths inside a crumbling rim of floor. Ghost floor is drawn the same, joined to it. */
function pit(p: Painter, mask: number): void {
  cryptFloor(p, 0);
  region(p, mask, 2, '#0c0a0c', '#2a2522', '#141014', 0.2);
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
      region(p, v.mask, 0, '#3a3230', C.ink, '#4e4440', 0.2);
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
  p.speckle('#3c463b', 0.2);
  p.speckle('#6c7a64', 0.08);
  p.speckle('#8e9a84', 0.02);
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
    region(p, v.mask, 3, '#1c2224', '#3a4642', '#283032', 0.12);
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
      p.speckle('#5e5a56', 0.2);
      p.speckle('#9a9690', 0.08);
      for (let i = 0; i < 3; i++) p.rect(nextInt(p.rng, 0, 13), nextInt(p.rng, 0, 14), 3, 2, '#68645f');
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
      p.speckle('#c8d6e2', 0.18);
      p.speckle('#ffffff', 0.08);
      p.rect(nextInt(p.rng, 0, 10), nextInt(p.rng, 2, 13), 5, 1, '#d2dee8');
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
    autotile: false,
    variants: 2,
    paint: (p) => {
      p.fill('#5e7e9c');
      p.speckle('#7898b6', 0.25);
      p.speckle('#c8dcec', 0.05);
      p.rect(0, 12, 16, 4, '#46627e');
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
  path: {
    autotile: true,
    variants: 0,
    paint: (p, v) => {
      grass(p);
      region(p, v.mask, 2, C.dirt, C.dirtShade, C.dirtShade, 0.1);
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
      region(p, v.mask, 3, C.water, C.waterLight, C.waterShade, 0.08);
      flow(p, v.mask, v.frame, 3, C.waterLight);
    },
  },
  rock: {
    autotile: true,
    variants: 0,
    paint: (p, v) => {
      grass(p);
      region(p, v.mask, 1, C.rock, C.rockShade, C.rockLight, 0.12);
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
      p.rect(0, 5, 16, 2, C.wood);
      p.rect(0, 7, 16, 1, C.woodShade);
      p.rect(0, 10, 16, 2, C.wood);
      p.rect(0, 12, 16, 1, C.woodShade);
      for (const x of [2, 11]) {
        p.rect(x, 2, 3, 13, C.wood);
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
    autotile: true,
    variants: 0,
    paint: (p, v) => {
      grass(p);
      region(p, v.mask, 1, C.dirtShade, C.dirtShade, C.dirt, 0.12);
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
      planks(p, C.wood, C.woodShade, true);
      p.rect(0, 0, 16, 2, C.ink);
      p.rect(0, 14, 16, 2, C.woodShade);
    },
  },
  door: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      planks(p, C.wood, C.woodShade, true);
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
      planks(p, C.woodShade, C.ink, true);
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
      region(p, v.mask, 2, C.waterLight, C.water, C.rockLight, 0.08);
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
      planks(p, C.wood, C.woodShade, true);
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
      planks(p, C.wood, C.woodShade, true);
      p.rect(0, 0, 16, 2, C.ink);
      p.rect(0, 14, 16, 2, C.woodShade);
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
      planks(p, C.wood, C.woodShade, false);
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
      p.speckle(C.dirtShade, 0.1);
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
      region(p, v.mask, 0, C.caveWall, C.ink, C.caveWallLight, 0.1);
    },
  },
  sap: {
    autotile: true,
    variants: 0,
    frames: 4,
    frameMs: 260,
    paint: (p, v) => {
      caveFloor(p);
      region(p, v.mask, 2, C.sap, C.sapShade, C.sapShade, 0.1);
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
      region(p, v.mask, 0, C.rootShade, C.ink, C.caveWall, 0.12);
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
      planks(p, C.floor, C.floorShade, v.variant === 1);
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
      planks(p, C.floor, C.floorShade, false);
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
      planks(p, C.floor, C.floorShade, false);
      p.speckle(C.ink, 0.05);
    },
  },
};
