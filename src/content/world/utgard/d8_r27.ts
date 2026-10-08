import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R27: ScreenDef = {
  id: 'd8_r27',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose:
    "The west wing's door hall: bars on the way west, opened by a stone eye beyond a chasm (20, 2) that only an arrow reaches. South, a side hall with a key.",
  things: [
    { k: 'switch', at: { x: 20, y: 2 }, eye: true },
    { k: 'shutter', id: 'd8_sh_r27w', at: { x: 0, y: 10 }, w: 1, h: 2, opens: 'switches' },
    { k: 'enemy', id: 'draugr', at: { x: 28, y: 14 } },
    { k: 'prop', id: 'pot', at: { x: 35, y: 18 } },
  ],
  map: room('ews').pits(2, 4, 36, 3).pillars({ x: 8, y: 14 }, { x: 30, y: 9 }).done(),
};
