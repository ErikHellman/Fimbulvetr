import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R26: ScreenDef = {
  id: 'd8_r26',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose:
    'A pit with a switch on an island in it (20, 7): only the boomerang reaches it, and it lifts the bars south.',
  things: [
    { k: 'switch', at: { x: 20, y: 7 } },
    { k: 'shutter', id: 'd8_sh_r26s', at: { x: 19, y: 21 }, w: 2, h: 1, opens: 'switches' },
    { k: 'enemy', id: 'isvargr', at: { x: 30, y: 15 } },
    { k: 'prop', id: 'pot', at: { x: 4, y: 3 } },
  ],
  map: room('es').pits(16, 4, 9, 7).floor(19, 6, 3, 3).done(),
};
