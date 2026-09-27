import type { WorldLayout } from '@core/world/screen';

/** Screens on the 16×12 overworld grid, and each dungeon's own grid of rooms. Interiors are on none. */
export const WORLD_LAYOUT: WorldLayout = {
  cols: 16,
  rows: 12,
  at: {
    test_a: [0, 0],
    test_b: [1, 0],
    test_c: [1, 1],
    myr_north: [4, 5],
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
  dungeons: {
    /** Rótarhellir, under Yggdrasil's roots in Myrkviðr: entered from myr_roots into d1_r01. */
    d1: {
      cols: 3,
      rows: 4,
      at: {
        d1_r10: [0, 0],
        d1_r12: [1, 0],
        d1_r09: [2, 0],
        d1_r07: [0, 1],
        d1_r11: [1, 1],
        d1_r08: [2, 1],
        d1_r05: [0, 2],
        d1_r04: [1, 2],
        d1_r06: [2, 2],
        d1_r02: [0, 3],
        d1_r01: [1, 3],
        d1_r03: [2, 3],
      },
    },
  },
};
