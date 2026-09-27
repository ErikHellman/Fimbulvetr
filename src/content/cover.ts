import type { CoverDef } from '@core/world/cover';
import type { CoverId } from './ids';
import type { TerrainId } from './terrain';

/** Open ground where snow lies and mud gathers. */
const GROUND: readonly TerrainId[] = ['grass', 'path', 'field', 'yard', 'mound'];

export const COVER_DEFS = {
  tall_grass: { id: 'tall_grass', seasons: ['summer'], slow: 0.6 },
  /** Autumn leaf piles under the trees: they hide what lies beneath until cut or blown away. */
  leaves: { id: 'leaves', seasons: ['autumn'], slow: 0.8, hides: true, blown: true },
  /** Winter snow over all open ground outdoors; the sword clears a path. */
  snow: { id: 'snow', seasons: ['winter'], slow: 0.7, grows: { on: GROUND }, cloak: true },
  /** Deep drifts, drawn on the map (`^`): no blade clears them; fire melts them (Eldr, M2b). */
  drift: { id: 'drift', seasons: ['winter'], slow: 0.5, cut: false, cloak: true },
  /** Spring mud along the water on wet days; it cannot be cleared, only waited out. */
  mud: {
    id: 'mud',
    seasons: ['spring'],
    slow: 0.75,
    grows: { on: GROUND, by: ['water', 'ford'] },
    wet: true,
    cut: false,
  },
  /** Winter ice on open water: walkable, and fire melts it. */
  ice: { id: 'ice', seasons: ['winter'], slow: 1, grows: { on: ['water'] }, cut: false, walk: true },
} as const satisfies Record<CoverId, CoverDef>;

/** Map characters that also grow cover. LEGEND maps the same characters to the terrain beneath. */
export const COVER_LEGEND: Readonly<Record<string, CoverId>> = {
  '"': 'tall_grass',
  '%': 'leaves',
  '^': 'drift',
};
