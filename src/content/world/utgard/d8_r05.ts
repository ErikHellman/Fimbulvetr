import type { ScreenDef } from '@core/world/screen';
import { flag, not } from '../../dialogue/util';
import { room } from './templates';

export const d8R05: ScreenDef = {
  id: 'd8_r05',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose:
    "A beam from a window (3, 3) runs east, and a fixed prism (28, 3) sends it south. Ask's mirror in its path at (28, 14) sends it west to an eye (10, 14), and the bars of the alcove east lift on a piece of heart. Lock C on the door west.",
  things: [
    { k: 'lock', id: 'd8_lock_c', at: { x: 0, y: 10 }, w: 1, h: 2 },
    { k: 'beam', at: { x: 3, y: 3 }, dir: 'e' },
    { k: 'prism', at: { x: 28, y: 3 }, turn: '\\' },
    { k: 'eye', at: { x: 10, y: 14 }, flag: 'st_d8_eye_r05' },
    { k: 'gate', at: { x: 31, y: 7 }, w: 1, h: 2, art: 'bars', closed: not(flag('st_d8_eye_r05')) },
    { k: 'piece', id: 'hp_d8_keep', at: { x: 33, y: 7 } },
    { k: 'enemy', id: 'frostvaettr', at: { x: 20, y: 16 } },
  ],
  map: room('ew').niche(10, 14, 'e').cell(31, 5, 6, 6, 'w').done(),
};
