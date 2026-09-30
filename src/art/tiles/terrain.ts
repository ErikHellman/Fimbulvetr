import type { TerrainId } from '@content/terrain';
import { nextFloat, nextInt } from '@core/math/rng';
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
} as const satisfies Partial<Record<TerrainId, TerrainArt>>;

export const TERRAIN_ART: Readonly<Record<TerrainId, TerrainArt>> = {
  ...DEEP_WOOD,
  ...MYRLAND_WATERS,
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
