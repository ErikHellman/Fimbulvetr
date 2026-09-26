import type { TerrainId } from '@content/terrain';
import { nextFloat } from '@core/math/rng';
import { C } from '../palette';
import type { Painter } from '../painter';
import { insideBlob, onBlobEdge } from './blob';

export interface TerrainArt {
  readonly autotile: boolean;
  /** Plain variants (ignored for auto-tiled terrain, which always has 47). */
  readonly variants: number;
  paint(p: Painter, v: { readonly mask: number; readonly variant: number }): void;
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

function tree(p: Painter, variant: number): void {
  grass(p);
  p.rect(7, 12, 2, 4, C.trunk);
  const cx = 7.5;
  const cy = 6.5;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 7) continue;
      if (d > 6) p.px(x, y, C.ink);
      else if (dx + dy > 2) p.px(x, y, C.leafShade);
      else p.px(x, y, C.leaf);
    }
  }
  const hx = 5 + variant;
  p.px(hx, 4, C.leafLight);
  p.px(hx + 1, 4, C.leafLight);
  p.px(hx, 5, C.leafLight);
}

/** Grass on top, a short earth bank below: reads as "you can drop down here". */
function ledge(p: Painter): void {
  grass(p);
  p.rect(0, 10, 16, 1, C.ink);
  p.rect(0, 11, 16, 5, C.dirtShade);
  p.speckle(C.grassShade, 0.02);
  for (let x = 1; x < 16; x += 4) p.px(x, 13, C.dirt);
}

function disc(
  p: Painter,
  cx: number,
  cy: number,
  rad: number,
  colour: (dx: number, dy: number) => string,
): void {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= rad * rad) p.px(x, y, colour(dx, dy));
    }
  }
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

function furniture(p: Painter, draw: () => void): void {
  floor(p);
  draw();
}

export const TERRAIN_ART: Readonly<Record<TerrainId, TerrainArt>> = {
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
    paint: (p, v) => {
      grass(p);
      region(p, v.mask, 3, C.water, C.waterLight, C.waterShade, 0.08);
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
    variants: 2,
    paint: (p, v) => {
      tree(p, v.variant);
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
    paint: (p, v) => {
      grass(p);
      region(p, v.mask, 0, C.turf, C.ink, C.turfLight, 0.1);
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++)
          if (insideBlob(v.mask, x, y, 0) && !onBlobEdge(v.mask, x, y, 0) && (x + y * 3) % 11 === 0)
            p.px(x, y, C.turfShade);
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
    paint: (p, v) => {
      grass(p);
      region(p, v.mask, 2, C.waterLight, C.water, C.rockLight, 0.08);
    },
  },
  well: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      grass(p);
      disc(p, 8, 8, 7.5, (dx, dy) => (dx * dx + dy * dy > 49 ? C.ink : dx + dy > 3 ? C.rockShade : C.rock));
      disc(p, 8, 8, 4, () => C.ink);
      disc(p, 8, 8, 3, (dx) => (dx > 1 ? C.waterShade : C.water));
    },
  },
  trough: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      grass(p);
      p.rect(0, 4, 16, 9, C.ink);
      p.rect(1, 5, 14, 7, C.wood);
      p.rect(2, 6, 12, 3, C.water);
      p.rect(1, 10, 14, 2, C.woodShade);
    },
  },
  stump: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      grass(p);
      disc(p, 8, 9, 6.5, (dx, dy) => (dx * dx + dy * dy > 36 ? C.ink : dy > 2 ? C.woodShade : C.straw));
      disc(p, 8, 8, 2, () => C.strawShade);
    },
  },
  bed: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      furniture(p, () => {
        p.rect(1, 1, 14, 15, C.ink);
        p.rect(2, 2, 12, 13, C.straw);
        p.rect(3, 3, 10, 3, C.sack);
        p.rect(2, 7, 12, 8, C.blanket);
        p.rect(2, 13, 12, 2, C.blanketShade);
      });
    },
  },
  hearth: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      furniture(p, () => {
        disc(p, 8, 8, 7.5, (dx, dy) => (dx * dx + dy * dy > 42 ? C.rockShade : C.rock));
        disc(p, 8, 8, 4.5, () => C.ink);
        disc(p, 8, 9, 3, (dx, dy) => (dy < -1 ? C.emberLight : C.ember));
      });
    },
  },
  table: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      furniture(p, () => {
        p.rect(1, 3, 14, 11, C.ink);
        p.rect(2, 4, 12, 8, C.wood);
        p.rect(2, 12, 12, 1, C.woodShade);
        p.rect(4, 6, 3, 2, C.clay);
        p.rect(9, 7, 2, 2, C.straw);
      });
    },
  },
  menhir: {
    autotile: false,
    variants: 1,
    paint: (p) => {
      grass(p);
      p.rect(4, 0, 8, 16, C.ink);
      p.rect(5, 1, 6, 14, C.rock);
      p.rect(9, 1, 2, 14, C.rockShade);
      p.rect(6, 4, 1, 3, C.ink);
      p.rect(7, 5, 2, 1, C.ink);
      p.rect(7, 9, 1, 4, C.ink);
    },
  },
};
