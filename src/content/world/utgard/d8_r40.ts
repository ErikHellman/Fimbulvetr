import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R40: ScreenDef = {
  id: 'd8_r40',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose: 'A channel of lava (columns 10–12) from wall to wall: Ís crusts it to cross. The way on is north.',
  things: [
    { k: 'crack', id: 'd8_k_r39e', at: { x: 0, y: 10 }, w: 1, h: 2, art: 'stake' },
    { k: 'enemy', id: 'isvargr', at: { x: 28, y: 12 } },
    { k: 'prop', id: 'pot', at: { x: 35, y: 3 } },
  ],
  map: room('wn').lava(10, 2, 3, 18).done(),
};
