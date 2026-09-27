import type { WorldLayout } from '@core/world/screen';

/** Screens on the 16×12 overworld grid. Interiors and dungeon rooms are not on it. */
export const WORLD_LAYOUT: WorldLayout = {
  cols: 16,
  rows: 12,
  at: {
    test_a: [0, 0],
    test_b: [1, 0],
    test_c: [1, 1],
    myr_hollow: [3, 6],
    myr_deep: [4, 6],
    myr_roots: [5, 6],
    myr_clearing: [3, 7],
    myr_road: [4, 7],
    myr_pines: [5, 7],
    myr_brook: [3, 8],
    myr_road_s: [4, 8],
    myr_charcoal: [5, 8],
    ask_gate: [4, 9],
    ask_ridge: [5, 9],
    ask_pasture: [3, 10],
    ask_farmyard: [4, 10],
    ask_village: [5, 10],
    ask_hof: [6, 10],
    ask_field: [4, 11],
    ask_brook: [5, 11],
  },
};
