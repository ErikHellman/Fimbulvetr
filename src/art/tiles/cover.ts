import type { CoverId } from '@content/ids';
import { nextInt } from '@core/math/rng';
import { C } from '../palette';
import type { Painter } from '../painter';

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

export const COVER_ART: Readonly<Record<CoverId, CoverArt>> = {
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
};
