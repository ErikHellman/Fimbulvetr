import type { ScreenDef } from '@core/world/screen';
import { flag, not } from '../../dialogue/util';
import { room } from './templates';

export const d8R03: ScreenDef = {
  id: 'd8_r03',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose:
    "A beam from a window (36, 17) runs west along the floor. Ask's mirror at (12, 17) sends it north to an eye in its niche (12, 5), and the rime over the door west melts.",
  things: [
    { k: 'beam', at: { x: 36, y: 17 }, dir: 'w' },
    { k: 'eye', at: { x: 12, y: 5 }, flag: 'st_d8_eye_r03' },
    { k: 'gate', at: { x: 0, y: 10 }, w: 2, h: 2, art: 'rime', closed: not(flag('st_d8_eye_r03')) },
    { k: 'enemy', id: 'isvargr', at: { x: 26, y: 8 } },
  ],
  map: room('ew').niche(12, 5, 's').pillars({ x: 24, y: 12 }).done(),
};
