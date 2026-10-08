import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R14: ScreenDef = {
  id: 'd8_r14',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose: "The giants' larder: a chest of bombs, and a basin of meltwater (4, 2).",
  things: [
    { k: 'chest', id: 'd8_c_r14', at: { x: 20, y: 6 }, gives: { item: 'bombs', n: 5 } },
    { k: 'use', at: { x: 3, y: 2 }, w: 3, script: 'd8_basin' },
    { k: 'prop', id: 'pot', at: { x: 30, y: 4 } },
    { k: 'prop', id: 'pot', at: { x: 30, y: 16 } },
  ],
  map: room('e').fill(3, 2, 3, 1, 'U').pillars({ x: 12, y: 12 }).done(),
};
