import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R02: ScreenDef = {
  id: 'd8_r02',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose: 'Ice wolves, and lock D on the door west to the high seal.',
  things: [
    { k: 'lock', id: 'd8_lock_d', at: { x: 0, y: 10 }, w: 1, h: 2 },
    { k: 'enemy', id: 'isvargr', at: { x: 14, y: 6 } },
    { k: 'enemy', id: 'isvargr', at: { x: 26, y: 15 } },
    { k: 'prop', id: 'pot', at: { x: 35, y: 3 } },
  ],
  map: room('ew').pillars({ x: 10, y: 14 }, { x: 28, y: 5 }).done(),
};
