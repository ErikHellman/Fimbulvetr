import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R32: ScreenDef = {
  id: 'd8_r32',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose: 'Lock B bars the stair north into the east wing’s upper halls.',
  things: [
    { k: 'lock', id: 'd8_lock_b', at: { x: 19, y: 0 }, w: 2, h: 1 },
    { k: 'enemy', id: 'frostvaettr', at: { x: 28, y: 6 } },
    { k: 'enemy', id: 'isvargr', at: { x: 12, y: 12 } },
    { k: 'prop', id: 'pot', at: { x: 4, y: 3 } },
  ],
  map: room('sn').pillars({ x: 14, y: 8 }, { x: 24, y: 8 }).done(),
};
