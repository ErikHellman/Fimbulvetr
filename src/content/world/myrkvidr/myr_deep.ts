import type { ScreenDef } from '@core/world/screen';

export const myrDeep: ScreenDef = {
  id: 'myr_deep',
  region: 'myrkvidr',
  purpose:
    'Deep Myrkviðr, old pines: the road north to Uppvík lies under a fallen tree (cleared in M2). Draugr walk here at night.',
  things: [
    {
      k: 'sign',
      at: { x: 18, y: 2 },
      w: 4,
      text: {
        en: 'The road north to Uppvík. A great pine has fallen across it.',
        sv: 'Vägen norrut mot Uppvík. En stor tall har fallit över den.',
      },
    },
    { k: 'enemy', id: 'vargr', at: { x: 10, y: 15 } },
    { k: 'enemy', id: 'draugr', at: { x: 29, y: 8 }, when: { k: 'phase', is: 'night' } },
  ],
  map: [
    'PPPPTPPPPPPPPTTPPP,,,,PTPTPPPPPPTPPPTPPP',
    'PTPTPPPPPPPPPPPPPP,,,,TTTPTPPPTPTTPPPPTP',
    'PTTPPPTPPTPTPTPPPPLLLLTPPPTPPTTPTPPTPPTP',
    'PPTTTPPPTPTPTPPPPP,,,,TPPPPPPPPPPPTPPPPP',
    'PTTPPPPPPTPPTPPPTT,,,,TPPTPPTPPPTTTPPTPP',
    'PTPP.%.PT..PPT%PT.,,,,PTP..PP%%%..T%PPTT',
    'PPTPP....P.%......,,,,P..P.P.......%TTTP',
    'PPTPP.............,,,,%....%.......TPPPP',
    'PPPP.....m........,,,,..............TTTP',
    'PTPT..............,,,,P%......%....PPPPP',
    'PPPPP.............,,,,.P......P.P...TPPP',
    '..................,,,,.%.....%...P..PPPP',
    '..............P...,,,,.P%...%PP.........',
    '....%.P........P%.,,,,P%.......%........',
    'PTPPP.%...........,,,,........%P........',
    'PPPP%...P%....P...,,,,..............TTPP',
    'TTTP%.............,,,,P.......m....%PPPP',
    'TTPPP.P%...%.%P%..,,,,..%.%P..%...PTPTPP',
    'TPPPPPP.PT.T%%.T.P,,,,.%PP.PPPP.P.%.PPPT',
    'PPPPPPTTTPTPPTTTTP,,,,PTPTPPTTTPTPTPPPPT',
    'PPTTTTPTPPTPTPPPTT,,,,PPTPPPPTTPPPPPPPTP',
    'TPPPPTTPPPPPTTPPTP,,,,TPPPPPTTTPTPTPPTPP',
  ],
};
