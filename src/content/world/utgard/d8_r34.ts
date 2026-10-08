import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R34: ScreenDef = {
  id: 'd8_r34',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose: 'Ice wolves, and a cracked wall west that a bomb opens.',
  things: [
    { k: 'crack', id: 'd8_k_r34w', at: { x: 0, y: 10 }, w: 1, h: 2, art: 'wall' },
    { k: 'enemy', id: 'isvargr', at: { x: 14, y: 8 } },
    { k: 'enemy', id: 'isvargr', at: { x: 26, y: 14 } },
    { k: 'prop', id: 'pot', at: { x: 35, y: 3 } },
  ],
  map: room('nw').pillars({ x: 10, y: 14 }, { x: 28, y: 5 }).done(),
};
