import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R22: ScreenDef = {
  id: 'd8_r22',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose: 'A map-room of the giants: the compass in a chest.',
  things: [
    { k: 'chest', id: 'd8_c_compass', at: { x: 20, y: 6 }, gives: { item: 'compass' } },
    { k: 'enemy', id: 'isvargr', at: { x: 14, y: 14 } },
    { k: 'prop', id: 'pot', at: { x: 4, y: 3 } },
    { k: 'prop', id: 'pot', at: { x: 4, y: 18 } },
  ],
  map: room('e').pillars({ x: 10, y: 9 }, { x: 28, y: 9 }).done(),
};
