import type { CoverDef } from '@core/world/cover';
import type { CoverId } from './ids';

export const COVER_DEFS = {
  tall_grass: { id: 'tall_grass', seasons: ['summer'], slow: 0.6 },
  /** Autumn leaf piles under the trees: they hide what lies beneath until cut or blown away. */
  leaves: { id: 'leaves', seasons: ['autumn'], slow: 0.8, hides: true, blown: true },
} as const satisfies Record<CoverId, CoverDef>;

/** Map characters that also grow cover. LEGEND maps the same characters to the terrain beneath. */
export const COVER_LEGEND: Readonly<Record<string, CoverId>> = {
  '"': 'tall_grass',
  '%': 'leaves',
};
