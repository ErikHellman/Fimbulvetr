import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R30: ScreenDef = {
  id: 'd8_r30',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose:
    "The east wing's door hall: a chasm (columns 25–28) crossed only by the grapple, between posts at (23, 10) and (30, 10). South, a side hall with a key.",
  things: [
    { k: 'post', at: { x: 23, y: 10 } },
    { k: 'post', at: { x: 30, y: 10 } },
    { k: 'enemy', id: 'isvargr', at: { x: 12, y: 14 } },
    { k: 'prop', id: 'pot', at: { x: 4, y: 3 } },
    { k: 'prop', id: 'pot', at: { x: 35, y: 18 } },
  ],
  map: room('wes').pits(25, 2, 4, 18).done(),
};
