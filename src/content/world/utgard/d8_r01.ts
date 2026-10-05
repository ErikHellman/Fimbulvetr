import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R01: ScreenDef = {
  id: 'd8_r01',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose:
    "The high seal: a beam from a window (4, 17) runs east to a prism (30, 17) that a sword blow turns north. Ask's mirror at (30, 5) sends it west into the seal's eye (10, 5). South, bars to the west wing that open from this side.",
  things: [
    { k: 'lock', id: 'd8_lock_d', at: { x: 39, y: 10 }, w: 1, h: 2 },
    { k: 'beam', at: { x: 4, y: 17 }, dir: 'e' },
    { k: 'prism', at: { x: 30, y: 17 }, turn: '\\', turns: true },
    { k: 'eye', at: { x: 10, y: 5 }, flag: 'st_d8_seal_n' },
    { k: 'shutter', id: 'd8_sh_r01s', at: { x: 19, y: 21 }, w: 2, h: 1, opens: 'clear' },
    {
      k: 'sign',
      at: { x: 20, y: 12 },
      text: {
        en: 'THE THIRD SEAL: FOR WHAT WAS LEARNED ON THE MOUNTAIN.',
        sv: 'DET TREDJE SIGILLET: FÖR DET SOM LÄRDES PÅ BERGET.',
      },
    },
  ],
  map: room('es').niche(10, 5, 'e').done(),
};
