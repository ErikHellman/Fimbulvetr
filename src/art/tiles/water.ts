import { nextInt } from '@core/math/rng';
import { C } from '../palette';
import type { Painter } from '../painter';

/**
 * Sökkva Kvern's water overlay, drawn on the cover layer over the rising terrains (see waterIndices):
 * water standing over a flooded sluice, and a race's planks floated up to the brim.
 */
export const WATER_ART = {
  flooded: (p: Painter): void => {
    p.fill(C.waterShade);
    p.speckle(C.water, 0.25);
    for (let i = 0; i < 3; i++) p.rect(nextInt(p.rng, 0, 11), nextInt(p.rng, 1, 15), 5, 1, C.waterLight);
  },
  afloat: (p: Painter): void => {
    p.fill(C.waterShade);
    p.speckle(C.water, 0.2);
    // Two planks across the race, pinned end to end.
    for (const y of [2, 9]) {
      p.rect(0, y, 16, 5, C.wood);
      p.rect(0, y + 4, 16, 1, C.woodShade);
      p.rect(1, y + 1, 1, 1, C.hoop);
      p.rect(14, y + 1, 1, 1, C.hoop);
    }
  },
} as const;
