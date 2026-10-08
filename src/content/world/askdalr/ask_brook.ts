import type { ScreenDef } from '@core/world/screen';

export const askBrook: ScreenDef = {
  id: 'ask_brook',
  region: 'askdalr',
  purpose: "The brook with its ford and Bjarni's jetty: the quiet corner of the valley.",
  things: [
    /** One of Sigrún's crates, in the brook's meadow (`q_crates`): lift it and carry it to her door in the village. */
    {
      k: 'prop',
      id: 'crate_c',
      at: { x: 8, y: 6 },
      when: {
        k: 'all',
        of: [
          { k: 'flag', id: 'q_crates_asked' },
          { k: 'not', c: { k: 'flag', id: 'q_crate_c' } },
        ],
      },
    },
    {
      k: 'sign',
      at: { x: 34, y: 4 },
      text: {
        en: 'A marker stone: “Bjarni’s fishing. Keep off.”',
        sv: 'En märksten: ”Bjarnes fiske. Håll er borta.”',
      },
    },
  ],
  map: [
    'TTTTTTTTTTTTTTTTTT,,,,TTTTTTTTTTTTTTTTTT',
    'T.................,,,,....~~~~.........T',
    'T.................,,,,....~~~~.........T',
    'T...T.............,,,,....~~~~.........T',
    'T.................,,,,..JJJJ~~....M....T',
    'T.................,,,,....~~~~.........T',
    'T.................,,,,....~~~~.........T',
    'T.................,,,,....~~~~.........T',
    'T.................,,,,....~~~~......T..T',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,oooo.........T',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,oooo.........T',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,oooo.........T',
    ',,,,,,,,,,,,,,,,,,,,,,,,,,oooo.........T',
    'T.........................~~~~.........T',
    'T.........................~~~~.."""""..T',
    'T.T.......................~~~~.."""""..T',
    'T.......T.................~~~~.."""""..T',
    'T.........................~~~~.."""""..T',
    'T.............T...........~~~~...T.....T',
    'T.........................~~~~.........T',
    'T.........................~~~~.........T',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
};
