import type { ScreenDef } from '@core/world/screen';
import { flag, not } from '../../dialogue/util';
import { room } from './templates';

export const d8R15: ScreenDef = {
  id: 'd8_r15',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose: 'A web of frozen rope across the door east, that only Vindr’s gust tears away. West, a larder.',
  things: [
    {
      k: 'gate',
      at: { x: 38, y: 10 },
      w: 2,
      h: 2,
      art: 'web',
      closed: not(flag('st_d8_web_r15')),
      blows: 'st_d8_web_r15',
    },
    { k: 'enemy', id: 'frostvaettr', at: { x: 12, y: 5 } },
    { k: 'enemy', id: 'draugr', at: { x: 26, y: 15 } },
    { k: 'prop', id: 'pot', at: { x: 4, y: 3 } },
  ],
  map: room('sew').pillars({ x: 16, y: 6 }, { x: 22, y: 14 }).done(),
};
