import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R10: ScreenDef = {
  id: 'd8_r10',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose:
    'The west wing’s upper hall: a wisp and a draugr, and the bars west lift once they fall. A side room east.',
  things: [
    { k: 'shutter', at: { x: 0, y: 10 }, w: 1, h: 2, opens: 'clear' },
    { k: 'enemy', id: 'frostvaettr', at: { x: 12, y: 5 } },
    { k: 'enemy', id: 'draugr', at: { x: 24, y: 12 } },
    { k: 'prop', id: 'pot', at: { x: 35, y: 3 } },
  ],
  map: room('swe').pillars({ x: 16, y: 5 }, { x: 22, y: 15 }).done(),
};
