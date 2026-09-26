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
};
