import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R18: ScreenDef = {
  id: 'd8_r18',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose: 'A barracks of the dead: the bars fall north and east behind Ask until it is clear.',
  things: [
    { k: 'shutter', at: { x: 19, y: 0 }, w: 2, h: 1, opens: 'clear' },
    { k: 'shutter', at: { x: 39, y: 10 }, w: 1, h: 2, opens: 'clear' },
    { k: 'enemy', id: 'draugr', at: { x: 14, y: 6 } },
    { k: 'enemy', id: 'draugr', at: { x: 26, y: 14 } },
    { k: 'enemy', id: 'isvargr', at: { x: 30, y: 6 } },
    { k: 'prop', id: 'pot', at: { x: 4, y: 3 } },
    { k: 'prop', id: 'pot', at: { x: 4, y: 18 } },
  ],
  map: room('wne').pillars({ x: 8, y: 4 }, { x: 8, y: 16 }, { x: 30, y: 16 }).done(),
};
