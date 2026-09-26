import type { CoverDef } from '@core/world/cover';
import type { CoverId } from './ids';

export const COVER_DEFS = {
  tall_grass: { id: 'tall_grass', seasons: ['summer'], slow: 0.6 },
} as const satisfies Record<CoverId, CoverDef>;

/** Map characters that also grow cover. LEGEND maps the same characters to the terrain beneath. */
export const COVER_LEGEND: Readonly<Record<string, CoverId>> = {
  '"': 'tall_grass',
};
