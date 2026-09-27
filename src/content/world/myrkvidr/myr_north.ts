import type { ScreenDef } from '@core/world/screen';

export const myrNorth: ScreenDef = {
  id: 'myr_north',
  region: 'myrkvidr',
  purpose:
    'The old north road out of Myrkviðr to Uppvík, between two clearings; a waystone. The fen lies west, the glade east. The vargr pack hunts here (the vargar hunt).',
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
    /** The hunt: the pack leader and two of its pack in the east clearing, until it falls. */
    {
      k: 'enemy',
      id: 'vargr_alpha',
      at: { x: 30, y: 9 },
      when: {
        k: 'all',
        of: [
          { k: 'flag', id: 'q_vargar_taken' },
          { k: 'not', c: { k: 'flag', id: 'q_vargar_alpha' } },
        ],
      },
      onDeath: [{ k: 'set', flag: 'q_vargar_alpha', value: true }],
    },
    {
      k: 'enemy',
      id: 'vargr',
      at: { x: 27, y: 6 },
      when: {
        k: 'all',
        of: [
          { k: 'flag', id: 'q_vargar_taken' },
          { k: 'not', c: { k: 'flag', id: 'q_vargar_alpha' } },
        ],
      },
    },
    {
      k: 'enemy',
      id: 'vargr',
      at: { x: 33, y: 13 },
      when: {
        k: 'all',
        of: [
          { k: 'flag', id: 'q_vargar_taken' },
          { k: 'not', c: { k: 'flag', id: 'q_vargar_alpha' } },
        ],
      },
    },
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
    'PTP.............TP,,,,..................',
    '..........P.......,,,,............P.....',
    '..................,,,,..................',
    '..................,,,,TT.............PPT',
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
