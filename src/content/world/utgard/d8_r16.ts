import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R16: ScreenDef = {
  id: 'd8_r16',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose:
    "The east wing's seal: a wind-fan (37, 10) beyond a chasm. Vindr spins it, and the east seal-stone in the seal hall burns. North, the stair up to the high wing.",
  things: [
    { k: 'switch', at: { x: 37, y: 10 }, fan: true, set: 'st_d8_seal_e' },
    {
      k: 'sign',
      at: { x: 20, y: 16 },
      text: {
        en: 'THE SECOND SEAL: FOR WHAT WAS LEARNED IN THE HIGH COUNTRY.',
        sv: 'DET ANDRA SIGILLET: FÖR DET SOM LÄRDES I HÖGLANDET.',
      },
    },
    { k: 'enemy', id: 'frostvaettr', at: { x: 12, y: 6 } },
  ],
  map: room('wn').pits(34, 2, 3, 18).done(),
};
