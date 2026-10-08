import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R09: ScreenDef = {
  id: 'd8_r09',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose:
    "The west wing's seal: a stone eye (2, 10) beyond a chasm. An arrow sets it, and the west seal-stone in the seal hall burns. North, bars that open only from the high wing's side.",
  things: [
    { k: 'switch', at: { x: 2, y: 10 }, eye: true, set: 'st_d8_seal_w' },
    { k: 'shutter', id: 'd8_sh_r01s', at: { x: 19, y: 0 }, w: 2, h: 1 },
    {
      k: 'sign',
      at: { x: 20, y: 16 },
      text: {
        en: 'THE FIRST SEAL: FOR WHAT WAS LEARNED IN THE LOWLANDS.',
        sv: 'DET FÖRSTA SIGILLET: FÖR DET SOM LÄRDES I LÅGLANDET.',
      },
    },
    { k: 'enemy', id: 'isvargr', at: { x: 28, y: 6 } },
  ],
  map: room('en').pits(4, 2, 5, 18).done(),
};
