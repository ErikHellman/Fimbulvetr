import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R23: ScreenDef = {
  id: 'd8_r23',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose:
    'A chasm across the hall (rows 6–9): the grapple crosses it north to a post at (19, 4), and back south to one at (20, 11). West, the compass room.',
  things: [
    { k: 'post', at: { x: 19, y: 4 } },
    { k: 'post', at: { x: 20, y: 11 } },
    { k: 'enemy', id: 'isvargr', at: { x: 30, y: 15 } },
    { k: 'prop', id: 'pot', at: { x: 4, y: 18 } },
  ],
  map: room('enw').pits(2, 6, 36, 4).done(),
};
