import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R37: ScreenDef = {
  id: 'd8_r37',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose:
    "The giants' wash-hall off the gate hall: the map in a chest, and a basin of meltwater (30, 2) to drink from. North to the hub's east half.",
  things: [
    { k: 'chest', id: 'd8_c_map', at: { x: 20, y: 6 }, gives: { item: 'dungeon_map' } },
    { k: 'use', at: { x: 30, y: 2 }, w: 3, script: 'd8_basin' },
    { k: 'enemy', id: 'isvargr', at: { x: 26, y: 14 } },
    { k: 'prop', id: 'pot', at: { x: 4, y: 3 } },
    { k: 'prop', id: 'pot', at: { x: 4, y: 18 } },
  ],
  map: room('nw').fill(30, 2, 3, 1, 'U').pillars({ x: 12, y: 12 }, { x: 26, y: 6 }).done(),
};
