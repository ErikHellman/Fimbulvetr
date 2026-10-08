import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R06: ScreenDef = {
  id: 'd8_r06',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose: "Ice wolves in the high wing's gallery, and a small key's chest once they fall.",
  things: [
    { k: 'enemy', id: 'isvargr', at: { x: 12, y: 6 } },
    { k: 'enemy', id: 'isvargr', at: { x: 28, y: 15 } },
    { k: 'chest', id: 'd8_c_key3', at: { x: 20, y: 6 }, gives: { item: 'small_key' }, appear: 'clear' },
    { k: 'prop', id: 'pot', at: { x: 4, y: 18 } },
  ],
  map: room('ew').pillars({ x: 10, y: 14 }, { x: 28, y: 5 }).done(),
};
