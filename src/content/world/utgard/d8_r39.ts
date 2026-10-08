import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R39: ScreenDef = {
  id: 'd8_r39',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose: 'A giant’s stake driven across the door east: only the hammer splits it.',
  things: [
    { k: 'crack', id: 'd8_k_r39e', at: { x: 39, y: 10 }, w: 1, h: 2, art: 'stake' },
    { k: 'enemy', id: 'draugr', at: { x: 12, y: 6 } },
    { k: 'enemy', id: 'isvargr', at: { x: 26, y: 15 } },
    { k: 'prop', id: 'pot', at: { x: 4, y: 18 } },
  ],
  map: room('ne').pillars({ x: 10, y: 14 }, { x: 28, y: 5 }).done(),
};
