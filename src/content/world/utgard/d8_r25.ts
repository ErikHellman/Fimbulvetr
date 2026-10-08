import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R25: ScreenDef = {
  id: 'd8_r25',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose: 'Lock A bars the stair north into the west wing’s upper halls.',
  things: [
    { k: 'lock', id: 'd8_lock_a', at: { x: 19, y: 0 }, w: 2, h: 1 },
    { k: 'enemy', id: 'frostvaettr', at: { x: 10, y: 6 } },
    { k: 'enemy', id: 'draugr', at: { x: 28, y: 12 } },
    { k: 'prop', id: 'pot', at: { x: 35, y: 18 } },
  ],
  map: room('sn').pillars({ x: 14, y: 8 }, { x: 24, y: 8 }).done(),
};
