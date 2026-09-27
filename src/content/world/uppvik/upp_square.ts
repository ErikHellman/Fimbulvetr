import type { ScreenDef } from '@core/world/screen';

export const uppSquare: ScreenDef = {
  id: 'upp_square',
  region: 'myrkvidr',
  purpose:
    "Uppvík's market square: Hrafnkell's trading house (door), the Þing-stone where notices are pinned, the well and two stalls.",
  things: [
    { k: 'door', at: { x: 8, y: 6 }, dir: 'n', to: 'upp_int_trader', arrive: { x: 19, y: 15 }, facing: 'n' },
    {
      k: 'sign',
      at: { x: 26, y: 12 },
      w: 2,
      text: {
        en: 'The Þing-stone. Notices: “Lost: one grey goat.” “Wanted: hunters for the vargr pack on the north road. Ask Bersi at the gate.”',
        sv: 'Tingstenen. Anslag: ”Borttappad: en grå get.” ”Jägare sökes för vargflocken vid norra vägen. Fråga Bersi vid porten.”',
      },
    },
    {
      k: 'sign',
      at: { x: 5, y: 14 },
      w: 3,
      text: {
        en: 'A stall of pots and dried fish. Nobody minds it.',
        sv: 'Ett stånd med krukor och torkad fisk. Ingen vaktar det.',
      },
    },
    {
      k: 'sign',
      at: { x: 30, y: 14 },
      w: 3,
      text: {
        en: 'Wool and wax, and a boy asleep behind them.',
        sv: 'Ull och vax, och en pojke som sover bakom.',
      },
    },
  ],
  map: [
    'IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII',
    'I......................................I',
    'I...RRRRRRRRRR............RRRRRRRRRR...I',
    'I...RRCRRRRRRR............RRRRRRRRRR...I',
    'I...RRRRRRRRRR............RRRRRRRRRR...I',
    'I...RRRRRRRRRR............RRRRRRRRRR...I',
    'I...WW+WDWW+WW............WWW+dW+WWW...I',
    'I.......p..............................I',
    'IppppppppppppppppppppppppppppppppppppppI',
    'pppppppppppppppppppppppppppppppppppppppp',
    'pppppppppppppppppppOOppppppppppppppppppp',
    'pppppppppppppppppppOOppppppppppppppppppp',
    'ppppppppppppppppppppppppppGGpppppppppppp',
    'IppppppppppppppppppppppppppppppppppppppI',
    'IppppxxxppppppppppppppppppppppxxxppppppI',
    'IppppppppppppppppppppppppppppppppppppppI',
    'I...............pppppppp...............I',
    'I...............pppppppp...............I',
    'I...T...........pppppppp.....T.........I',
    'I.........T.....pppppppp...........T...I',
    'I...............pppppppp...............I',
    'IIIIIIIIIIIIIIIIppppppppIIIIIIIIIIIIIIII',
  ],
};
