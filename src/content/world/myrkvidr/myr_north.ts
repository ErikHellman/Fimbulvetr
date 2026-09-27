import type { ScreenDef } from '@core/world/screen';

export const myrNorth: ScreenDef = {
  id: 'myr_north',
  region: 'myrkvidr',
  purpose:
    'The old north road out of Myrkviðr to Uppvík, between two clearings; a waystone. The vargr pack hunts here (the vargar hunt, M2c).',
  things: [
    {
      k: 'sign',
      at: { x: 25, y: 6 },
      text: {
        en: 'A waystone. North: Uppvík, the trading town. South: the deep wood, and Askdalr beyond it.',
        sv: 'En vägsten. Norrut: Uppvík, handelsstaden. Söderut: djupa skogen, och Askdalr bortom den.',
      },
    },
    { k: 'enemy', id: 'vargr', at: { x: 8, y: 10 } },
  ],
  /** Where the Myrkviðr spawn table may put foes (rolled by day and night, see content/spawns.ts). */
  spawns: [
    { x: 6, y: 8 },
    { x: 12, y: 14 },
    { x: 28, y: 7 },
    { x: 33, y: 13 },
    { x: 8, y: 12 },
  ],
  map: [
    'TTPPTPPTPTPTPTPPTP,,,,TPTTTTPPTTPPPTPPPP',
    'PTTPPTPTPTPTPPTTPP,,,,TTPPPPPTTTPPTPPPPP',
    'PPPPTTTPPPPTPPTPTT,,,,PTPPPPPPPTPPPPPTPP',
    'TPPPPTPTTPPPPTPTTT,,,,TTTPPTPPPTTPTPPTPP',
    'TPTPPTTPPPPTPPTTTP,,,,PP.............TPT',
    'PPP.............PT,,,,TP.....%...%...PPT',
    'PPP..%..........PT,,,,PT.M...........PTP',
    'PPP..........%..TP,,,,...............PPP',
    'PTP.............TP,,,,...............PPP',
    'PPP.......P.......,,,,............P..PPP',
    'TPT...............,,,,...............PTP',
    'PPP...............,,,,TT.............PPT',
    'PTT.............PP,,,,PP...%.........PPT',
    'PPP......%......TP,,,,TP.............PPT',
    'PPP.............PT,,,,TT..P........%.TTP',
    'TPT...%.........PP,,,,TP.............PTP',
    'TPP.............PP,,,,PTTPTPPPPTPTPTPPPP',
    'TPTPPPPPTPTTPPPTPP,,,,TPPTPTPPPPTPPPPPTP',
    'PTPTPPPTPPTTTTPTPP,,,,PTPPPPTTPPPPPTPPPP',
    'PTPTPPPPTTPTPPPPPP,,,,TTTPTPPTTTTPPPTPPP',
    'TPTPPPPTPTTPTPPPPT,,,,TPPTTTPTPPTTPPTPPP',
    'PPPPTTTPTPTTPTTPPP,,,,PTPTPPTTTTPPPPPPTP',
  ],
};
