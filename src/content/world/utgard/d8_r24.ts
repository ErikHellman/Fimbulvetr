import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R24: ScreenDef = {
  id: 'd8_r24',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose: 'Past lock B (south): two draugr, and the bars west lift once they fall.',
  things: [
    { k: 'lock', id: 'd8_lock_b', at: { x: 19, y: 21 }, w: 2, h: 1 },
    { k: 'shutter', at: { x: 0, y: 10 }, w: 1, h: 2, opens: 'clear' },
    { k: 'enemy', id: 'draugr', at: { x: 14, y: 8 } },
    { k: 'enemy', id: 'draugr', at: { x: 26, y: 12 } },
    { k: 'prop', id: 'pot', at: { x: 35, y: 3 } },
  ],
  map: room('sw').pillars({ x: 8, y: 14 }, { x: 30, y: 5 }).done(),
};
