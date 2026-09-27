import type { ScreenDef } from '@core/world/screen';

export const uppHall: ScreenDef = {
  id: 'upp_hall',
  region: 'myrkvidr',
  purpose:
    'The mead hall (door; rest and save), the hof (door) and a barred longhouse that opens after Act II.',
  things: [
    {
      k: 'door',
      at: { x: 16, y: 7 },
      dir: 'n',
      to: 'upp_int_meadhall',
      arrive: { x: 19, y: 16 },
      facing: 'n',
    },
    { k: 'door', at: { x: 8, y: 16 }, dir: 'n', to: 'upp_int_hof', arrive: { x: 20, y: 17 }, facing: 'n' },
    {
      k: 'sign',
      at: { x: 28, y: 16 },
      text: {
        en: 'Barred and silent. The shutters are fastened from inside.',
        sv: 'Bommad och tyst. Luckorna är stängda inifrån.',
      },
    },
  ],
  map: [
    'IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII',
    'I......................................I',
    'I.....RRRRRRRRRRRRRRRRRRRR.............I',
    'I.....RRRRRRRRRRRRRRRRRRRR....T........I',
    'I.....RRRRCRRRRRRRRRRCRRRR.............I',
    'I.....RRRRRRRRRRRRRRRRRRRR.........T...I',
    'I.....RRRRRRRRRRRRRRRRRRRR.............I',
    'I.....WW+WW+WWWWDWWW+WW+WW.............I',
    'I...............p......................I',
    'I..ppppppppppppppppppppppppppppppppppppp',
    'I..ppppppppppppppppppppppppppppppppppppp',
    'I..ppppppppppppppppppppppppppppppppppppp',
    'I..ppppppppppppppppppppppppppppppppppppp',
    'I.p.RRRRRRRRRR.........RRRRRRRRRRRR....I',
    'I.p.RRRRRRRRRR.........RRRRRRRRRRRR....I',
    'I.p.RRRRRRRRRR.........RRRRRRRRRRRR....I',
    'I.p.WW+WDWW+WW.........WW+WWdWWW+WW....I',
    'I.p.....p..............................I',
    'I.p.M...p....M....T.................T..I',
    'I.ppppppppp............................I',
    'I......................................I',
    'IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII',
  ],
};
