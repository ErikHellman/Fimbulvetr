import type { WorldLayout } from '@core/world/screen';

/** Screens on the 16×12 overworld grid. Interiors and dungeon rooms are not on it. */
export const WORLD_LAYOUT: WorldLayout = {
  cols: 16,
  rows: 12,
  at: { test_a: [0, 0], test_b: [1, 0], test_c: [1, 1] },
};
