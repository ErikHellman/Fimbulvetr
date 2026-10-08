import type { CoverDef } from '@core/world/cover';
import type { CoverId } from './ids';
import type { TerrainId } from './terrain';

/** Open ground where snow lies and mud gathers. */
const GROUND: readonly TerrainId[] = [
  'grass',
  'path',
  'field',
  'yard',
  'mound',
  'heath',
  'flagstone',
  'mire',
  'scree',
];

export const COVER_DEFS = {
  tall_grass: { id: 'tall_grass', seasons: ['summer'], slow: 0.6, burns: true },
  /** Autumn leaf piles under the trees: they hide what lies beneath until cut or blown away. */
  leaves: { id: 'leaves', seasons: ['autumn'], slow: 0.8, hides: true, blown: true, burns: true },
  /** Winter snow over all open ground outdoors; the sword clears a path. */
  snow: { id: 'snow', seasons: ['winter'], slow: 0.7, grows: { on: GROUND }, cloak: true },
  /** Deep drifts, drawn on the map (`^`): no blade clears them; fire melts them (Eldr, M2b). */
  drift: { id: 'drift', seasons: ['winter'], slow: 0.5, cut: false, cloak: true, melts: true, blasts: true },
  /** Spring mud along the water on wet days; it cannot be cleared, only waited out. */
  mud: {
    id: 'mud',
    seasons: ['spring'],
    slow: 0.75,
    grows: { on: GROUND, by: ['water', 'ford', 'shoal', 'rapids', 'spring'] },
    wet: true,
    cut: false,
  },
  /** Winter ice on open water: walkable, and fire melts it. */
  ice: {
    id: 'ice',
    seasons: ['winter'],
    slow: 1,
    grows: { on: ['water'] },
    cut: false,
    walk: true,
    melts: true,
  },
  /** Spring meltwater over a shoal: the river swells and the crossing is gone until summer. */
  flood: {
    id: 'flood',
    seasons: ['spring'],
    slow: 1,
    grows: { on: ['shoal'] },
    cut: false,
    sink: true,
  },
  /**
   * Ís laid on still water by the ice-song, in any season: walkable, fire melts it. It never grows; the
   * song places it, and it thaws when Ask leaves the screen (it is never saved).
   */
  is_ice: {
    id: 'is_ice',
    seasons: ['spring', 'summer', 'autumn', 'winter'],
    slow: 1,
    cut: false,
    walk: true,
    melts: true,
  },
  /**
   * Ís laid on lava (M8): a black crust Ask can cross, for a while. It never grows; the song places it, a
   * timer on the runtime cools it away (see systems/is.ts), and it is never saved.
   */
  crust: {
    id: 'crust',
    seasons: ['spring', 'summer', 'autumn', 'winter'],
    slow: 1,
    cut: false,
    walk: true,
  },
} as const satisfies Record<CoverId, CoverDef>;

/** Map characters that also grow cover. LEGEND maps the same characters to the terrain beneath. */
export const COVER_LEGEND: Readonly<Record<string, CoverId>> = {
  '"': 'tall_grass',
  '%': 'leaves',
  '^': 'drift',
};
