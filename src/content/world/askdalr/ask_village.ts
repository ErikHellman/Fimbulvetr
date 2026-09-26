import type { ScreenDef } from '@core/world/screen';

export const askVillage: ScreenDef = {
  id: 'ask_village',
  region: 'askdalr',
  purpose:
    "Askdalr village: the square, Sigrún's trading house (door) and the neighbours' houses. Most people are here by day.",
  things: [
    { k: 'door', at: { x: 8, y: 5 }, dir: 'n', to: 'ask_int_trader', arrive: { x: 19, y: 17 }, facing: 'n' },
    {
      k: 'sign',
      at: { x: 14, y: 12 },
      text: {
        en: 'The village well. Someone has carved a sheep on it.',
        sv: 'Byns brunn. Någon har ristat ett får i den.',
      },
    },
  ],
  map: [
    'TTTTTTTTTTTTTTTTTT,,,,TTTTTTTTTTTTTTTTTT',
    'T..RRRRRRRRRR.....,,,,....RRRRRRRRRR...T',
    'T..RRRRRRRRRR.....,,,,....RRRRRRRRRR...T',
    'T..RRRRRRRRRR..T..,,,,....RRRRRRRRRR...T',
    'T..RRRRRRRRRR.....,,,,..T.RRRRRRRRRR...T',
    'T..WWWWWDWWWW.....,,,,....WWWWWWWWWW.T.T',
    'T.................,,,,.................T',
    'T.................,,,,.................T',
    'T.;;;;;;;;;;;;;;;;,,,,;;;;;;;;;;;;;;;;.T',
    ',;;;;;;;;;;;;;;;;;,,,,;;;;;;;;;;;;;;;;;,',
    ',;;;;;;;;;;;;;;;;;,,,,;;;;;;;;;;;;;;;;;,',
    ',;;;;;;;;;;;;;;;;;,,,,;;;;;;;;;;;;;;;;;,',
    ',;;;;;;;;;;;;;O;;;,,,,;;;;;;;;;;;;;;;;;,',
    'T.;;;;;;;;;;;;;;;;,,,,;;;;;;;;;;;;;;;;.T',
    'T.................,,,,.................T',
    'T...RRRRRRRR......,,,,.....RRRRRRRRR...T',
    'T...RRRRRRRR......,,,,.....RRRRRRRRR...T',
    'T...RRRRRRRR....T.,,,,.....RRRRRRRRR...T',
    'T...WWWWWWWW......,,,,..T..WWWWWWWWW...T',
    'T.................,,,,.................T',
    'T.................,,,,.................T',
    'TTTTTTTTTTTTTTTTTT,,,,TTTTTTTTTTTTTTTTTT',
  ],
};
