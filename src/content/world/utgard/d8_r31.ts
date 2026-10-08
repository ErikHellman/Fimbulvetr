import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R31: ScreenDef = {
  id: 'd8_r31',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose: 'Two wind-fans in the corners (8, 3) and (31, 3): spun with Vindr, they lift the bars south.',
  things: [
    { k: 'switch', at: { x: 8, y: 3 }, fan: true },
    { k: 'switch', at: { x: 31, y: 3 }, fan: true },
    { k: 'shutter', id: 'd8_sh_r31s', at: { x: 19, y: 21 }, w: 2, h: 1, opens: 'switches' },
    { k: 'enemy', id: 'draugr', at: { x: 20, y: 12 } },
    { k: 'prop', id: 'pot', at: { x: 35, y: 18 } },
  ],
  map: room('ws').pillars({ x: 14, y: 14 }, { x: 24, y: 14 }).done(),
};
