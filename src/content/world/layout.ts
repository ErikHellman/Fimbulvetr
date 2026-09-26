import type { WorldLayout } from '@core/world/screen';

/** Screens on the 16×12 overworld grid. Interiors and dungeon rooms are not on it. */
export const WORLD_LAYOUT: WorldLayout = {
  cols: 16,
  rows: 12,
  at: {
    test_a: [0, 0],
    test_b: [1, 0],
    test_c: [1, 1],
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
