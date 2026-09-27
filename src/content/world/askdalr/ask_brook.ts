import type { ScreenDef } from '@core/world/screen';

export const askBrook: ScreenDef = {
  id: 'ask_brook',
  region: 'askdalr',
  purpose: "The brook with its ford and Bjarni's jetty: the quiet corner of the valley.",
  things: [
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
