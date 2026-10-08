import type { ScreenDef } from '@core/world/screen';

export const myrPines: ScreenDef = {
  id: 'myr_pines',
  region: 'myrkvidr',
  purpose: 'Dense old pines; a piece of heart hides under a leaf pile in a pocket of the wood.',
  things: [
    { k: 'piece', id: 'hp_myr_pines', at: { x: 12, y: 15 } },
    /** The wild bees' hive in a pine (`q_honey`): its comb can be taken in summer and autumn, smoked with the lantern. */
    { k: 'scenery', at: { x: 30, y: 5 }, w: 1, h: 1, art: 'hive', shown: { k: 'all', of: [] } },
    { k: 'use', at: { x: 30, y: 5 }, script: 'hive' },
    { k: 'enemy', id: 'vargr', at: { x: 20, y: 14 } },
  ],
  /** Where the Myrkviðr spawn table may put foes (rolled by day and night, see content/spawns.ts). */
  spawns: [
    { x: 6, y: 9 },
    { x: 28, y: 9 },
    { x: 12, y: 12 },
    { x: 25, y: 7 },
    { x: 20, y: 16 },
  ],
  map: [
    'PPPTPPTPPPPTTPTTPTPTPPTPP...PPPTPTTPPPPP',
    'PTTPPPPTPTPPPPPPTPPPPTPTP...PPPTTTPTPPPP',
    'TPPTTPTTTPPTPPPTPTTPPPTPP...PPPPPPPPPTPP',
    'TPTPPPPPTPPPTPPTPTPPTPPPP...PPPPPPPTPPPP',
    'PPPPPPTTPPPPTPTTPPTPPPTPT...TPPPPPPPPPPT',
    'PPPPPP.PT.P.........PPTP.....PTTT.PPTPPP',
    'TTTTPPT..PP.P...................PTTTPPPT',
    'PPPPPP.P..PP...........P.........PPPPTPP',
    '..................................PPPPPP',
    '.................................PPPPPPP',
    '.................................PPPPPTP',
    'PTTPPT...P...P....P..P...........TTPPTTT',
    'PPTPPT.......P.........P..........TPPPPP',
    'PTPTPTP...%%%%........P.....P.....PPTPPP',
    'TPPPTT....%%%%.PP.....P....P......PTPPPP',
    'PPPPTP....%%%%........P...........TTPPPP',
    'PPPPPPPP..%%%%..............P....TTPPPPT',
    'TPTTPP..PTP.T.T.P...PP.P..T.PP...TTTTPPT',
    'PTTTPPPPPPTPPPPTPPTPPPTTTPPPPP...PPPPPPP',
    'PTPPPPPPTPTPPPPPPTPPPPPPTPPTPP...PPPPTTP',
    'PPPPPPPTTPPTTPPPPPPTPPPPPPPTPP...TPPPPPT',
    'PPTTPTPPPPPPPPPPTTPTPPPPPTTPPP...PPPTPPP',
  ],
};
