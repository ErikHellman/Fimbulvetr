import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R38: ScreenDef = {
  id: 'd8_r38',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose: "A kennel below the east door hall: two ice wolves, and a small key's chest once they fall.",
  things: [
    { k: 'enemy', id: 'isvargr', at: { x: 12, y: 10 } },
    { k: 'enemy', id: 'isvargr', at: { x: 28, y: 10 } },
    { k: 'chest', id: 'd8_c_key2', at: { x: 20, y: 14 }, gives: { item: 'small_key' }, appear: 'clear' },
    { k: 'prop', id: 'pot', at: { x: 4, y: 18 } },
  ],
  map: room('n').pillars({ x: 6, y: 15 }, { x: 32, y: 15 }).done(),
};
