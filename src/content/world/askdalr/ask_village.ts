import type { ScreenDef, Thing } from '@core/world/screen';
import { afterRaid } from '../../dialogue/util';

/** The captives' houses, boarded up since the raid. */
const SHUT: Thing[] = [
  [31, 5],
  [8, 18],
  [31, 18],
].map(([x = 0, y = 0]): Thing => ({
  k: 'scenery',
  at: { x, y },
  w: 1,
  h: 1,
  art: 'boards',
  shown: afterRaid,
}));

export const askVillage: ScreenDef = {
  id: 'ask_village',
  region: 'askdalr',
  purpose:
    "Askdalr village: the square, Sigrún's trading house (door) and the neighbours' houses. Most people are here by day.",
  things: [
    /** The region's warp stone (Farvegr). */
    { k: 'warp', region: 'askdalr', at: { x: 24, y: 14 }, arrive: { x: 24, y: 15 } },
    { k: 'door', at: { x: 8, y: 5 }, dir: 'n', to: 'ask_int_trader', arrive: { x: 19, y: 17 }, facing: 'n' },
    {
      k: 'sign',
      at: { x: 14, y: 12 },
      w: 2,
      h: 2,
      text: {
        en: 'The village well. Someone has carved a sheep on it.',
        sv: 'Byns brunn. Någon har ristat ett får i den.',
      },
    },
    ...SHUT,
  ],
  map: [
    'TTTTTTTTTTTTTTTTTT,,,,TTTTTTTTTTTTTTTTTT',
    'T..RRRRRRRRRR.....,,,,....RRRRRRRRRR...T',
    'T..RRCRRRRRRR.....,,,,....RRRRRRRCRR...T',
    'T..RRRRRRRRRR..T..,,,,....RRRRRRRRRR...T',
    'T..RRRRRRRRRR.....,,,,..T.RRRRRRRRRR...T',
    'T..WWW+WDW+WW.....,,,,....WWW+WdW+WW.T.T',
    'T.................,,,,.................T',
    'T.................,,,,.................T',
    'T.;;;;;;;;;;;;;;;;,,,,;;;;;;;;;;;;;;;;.T',
    ',;;;;;;;;;;;;;;;;;,,,,;;;;;;;;;;;;;;;;;,',
    ',;;;;;;;;;;;;;;;;;,,,,;;;;;;;;;;;;;;;;;,',
    ',;;;;;;;;;;;;;;;;;,,,,;;;;;;;;;;;;;;;;;,',
    ',;;;;;;;;;;;;;OO;;,,,,;;;;;;;;;;;;;;;;;,',
    'T.;;;;;;;;;;;;OO;;,,,,;;;;;;;;;;;;;;;;.T',
    'T.................,,,,.................T',
    'T...RRRRRRRR......,,,,.....RRRRRRRRR...T',
    'T...RRCRRRRR......,,,,.....RRRRRRCRR...T',
    'T...RRRRRRRR....T.,,,,.....RRRRRRRRR...T',
    'T...WW+WdW+W......,,,,..T..WW+WdW+WW...T',
    'T.................,,,,.................T',
    'T.................,,,,.................T',
    'TTTTTTTTTTTTTTTTTT,,,,TTTTTTTTTTTTTTTTTT',
  ],
};
