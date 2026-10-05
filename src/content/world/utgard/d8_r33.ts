import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R33: ScreenDef = {
  id: 'd8_r33',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose: 'Two cold braziers: lit from the lantern, they lift the bars north.',
  things: [
    { k: 'crack', id: 'd8_k_r34w', at: { x: 39, y: 10 }, w: 1, h: 2, art: 'wall' },
    { k: 'brazier', at: { x: 14, y: 8 } },
    { k: 'brazier', at: { x: 26, y: 8 } },
    { k: 'shutter', id: 'd8_sh_r33n', at: { x: 19, y: 0 }, w: 2, h: 1, opens: 'braziers' },
    { k: 'enemy', id: 'draugr', at: { x: 20, y: 14 } },
    { k: 'prop', id: 'pot', at: { x: 4, y: 18 } },
  ],
  map: room('en').pillars({ x: 6, y: 4 }, { x: 32, y: 15 }).done(),
};
