import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R11: ScreenDef = {
  id: 'd8_r11',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose: 'A quiet armoury off the west wing: a chest of arrows, and pots.',
  things: [
    { k: 'chest', id: 'd8_c_r11', at: { x: 20, y: 6 }, gives: { item: 'arrows', n: 10 } },
    { k: 'prop', id: 'pot', at: { x: 30, y: 4 } },
    { k: 'prop', id: 'pot', at: { x: 30, y: 16 } },
    { k: 'prop', id: 'pot', at: { x: 34, y: 10 } },
  ],
  map: room('w').pillars({ x: 12, y: 4 }, { x: 12, y: 15 }).done(),
};
