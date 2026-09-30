import type { CoverId } from '@content/ids';
import { nextInt } from '@core/math/rng';
import { C } from '../palette';
import type { Painter } from '../painter';
import { setPixel } from '../raster';

export interface CoverArt {
  /** Transparent overlay of the cover standing. */
  standing(p: Painter): void;
  /** What is left once it is cut. */
  cut(p: Painter): void;
}

function tuft(p: Painter, x: number, y: number, h: number): void {
  p.rect(x, y - h, 1, h, C.grassShade);
  p.rect(x + 1, y - h + 1, 1, h - 1, C.leaf);
  p.px(x, y - h, C.grassLight);
  p.px(x + 1, y - h + 1, C.grassLight);
}

/** A fallen leaf: two pixels and a darker vein pixel. */
function leaf(p: Painter, x: number, y: number, colour: string): void {
  p.rect(x, y, 2, 1, colour);
  p.px(x + 1, y + 1, C.autumnShade);
}

/** Punches `n` random pixels open, last, so a field of blanket cover never reads as a grid. */
function holes(p: Painter, n: number): void {
  for (let i = 0; i < n; i++) setPixel(p.r, nextInt(p.rng, 0, 15), nextInt(p.rng, 0, 15), [0, 0, 0, 0]);
}

export const COVER_ART: Readonly<Record<CoverId, CoverArt>> = {
  /** Spring floodwater over the shoal: brown with silt, streaked with foam. */
  flood: {
    standing: (p) => {
      p.fill(C.waterShade);
      p.speckle(C.mud, 0.12);
      for (let i = 0; i < 4; i++) p.rect(nextInt(p.rng, 0, 12), nextInt(p.rng, 1, 15), 4, 1, C.foam);
      holes(p, 10);
    },
    cut: () => {},
  },
  tall_grass: {
    standing: (p) => {
      for (let i = 0; i < 9; i++)
        tuft(p, nextInt(p.rng, 0, 15), nextInt(p.rng, 9, 17), nextInt(p.rng, 6, 10));
      p.rect(0, 14, 16, 2, C.leafShade);
    },
    cut: (p) => {
      for (let i = 0; i < 6; i++) p.rect(nextInt(p.rng, 0, 15), nextInt(p.rng, 4, 15), 1, 2, C.stubble);
    },
  },
  leaves: {
    standing: (p) => {
      p.rect(1, 6, 14, 9, C.autumnShade);
      p.rect(2, 5, 12, 9, C.autumn);
      p.rect(0, 9, 16, 5, C.autumn);
      for (let i = 0; i < 14; i++)
        leaf(p, nextInt(p.rng, 0, 14), nextInt(p.rng, 4, 14), i % 3 === 0 ? C.autumnLight : C.ember);
      p.rect(0, 14, 16, 2, C.autumnShade);
    },
    cut: (p) => {
      for (let i = 0; i < 5; i++)
        leaf(p, nextInt(p.rng, 0, 14), nextInt(p.rng, 6, 14), i % 2 === 0 ? C.autumn : C.autumnLight);
    },
  },
  snow: {
    standing: (p) => {
      p.fill(C.snow);
      for (let i = 0; i < 5; i++) p.rect(nextInt(p.rng, 0, 13), nextInt(p.rng, 1, 14), 3, 1, C.snowShade);
      for (let i = 0; i < 4; i++) p.px(nextInt(p.rng, 0, 15), nextInt(p.rng, 0, 15), C.snowLight);
      holes(p, 10);
    },
    cut: (p) => {
      // Trodden slush at the edges of a cleared path.
      for (let i = 0; i < 7; i++) p.rect(nextInt(p.rng, 0, 14), nextInt(p.rng, 0, 15), 2, 1, C.snowShade);
    },
  },
  drift: {
    standing: (p) => {
      p.fill(C.snowShade);
      p.rect(1, 2, 14, 11, C.snow);
      p.rect(3, 1, 10, 3, C.snowLight);
      p.rect(0, 13, 16, 2, C.snowShade);
      p.rect(2, 12, 12, 1, C.iceShade);
      holes(p, 6);
    },
    cut: (p) => {
      for (let i = 0; i < 6; i++) p.rect(nextInt(p.rng, 0, 14), nextInt(p.rng, 8, 15), 2, 1, C.snowShade);
    },
  },
  mud: {
    standing: (p) => {
      p.rect(1, 3, 14, 11, C.mud);
      p.rect(0, 6, 16, 6, C.mud);
      p.rect(3, 2, 9, 2, C.mudShade);
      for (let i = 0; i < 6; i++) p.px(nextInt(p.rng, 1, 14), nextInt(p.rng, 4, 13), C.mudShade);
      for (let i = 0; i < 3; i++) p.rect(nextInt(p.rng, 2, 12), nextInt(p.rng, 5, 12), 2, 1, C.mudLight);
    },
    cut: (p) => {
      for (let i = 0; i < 4; i++) p.rect(nextInt(p.rng, 1, 13), nextInt(p.rng, 4, 13), 2, 1, C.mudShade);
    },
  },
  ice: {
    standing: (p) => {
      p.fill(C.ice);
      for (let i = 0; i < 3; i++) {
        const x = nextInt(p.rng, 1, 12);
        const y = nextInt(p.rng, 2, 13);
        p.rect(x, y, 3, 1, C.iceShade);
        p.px(x + 3, y + 1, C.iceShade);
      }
      for (let i = 0; i < 5; i++) p.px(nextInt(p.rng, 0, 15), nextInt(p.rng, 0, 15), C.iceLight);
      holes(p, 8);
    },
    cut: (p) => {
      // Floes left bobbing where the ice was melted open.
      p.rect(2, 3, 3, 2, C.iceLight);
      p.rect(10, 9, 3, 2, C.iceLight);
    },
  },
};
