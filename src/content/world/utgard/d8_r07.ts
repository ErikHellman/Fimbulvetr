import type { ScreenDef } from '@core/world/screen';
import { flag, not } from '../../dialogue/util';
import { room } from './templates';

export const d8R07: ScreenDef = {
  id: 'd8_r07',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose:
    'A crystal eye on a stone in a chasm (20, 4): no light falls here, but Bragð reaches it, and the rime over the door west melts.',
  things: [
    { k: 'eye', at: { x: 20, y: 4 }, flag: 'st_d8_eye_r07' },
    { k: 'gate', at: { x: 0, y: 10 }, w: 2, h: 2, art: 'rime', closed: not(flag('st_d8_eye_r07')) },
    {
      k: 'sign',
      at: { x: 26, y: 12 },
      text: {
        en: 'A carving of a man shouting at a mountain, and the mountain cracking.',
        sv: 'En ristning av en man som ropar mot ett berg, och berget som spricker.',
      },
    },
    { k: 'enemy', id: 'isvargr', at: { x: 30, y: 15 } },
  ],
  map: room('ew').pits(17, 2, 7, 6).floor(20, 4, 1, 1).done(),
};
