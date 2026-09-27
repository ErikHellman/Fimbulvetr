import type { ScreenDef } from '@core/world/screen';

export const myrRoots: ScreenDef = {
  id: 'myr_roots',
  region: 'myrkvidr',
  purpose:
    "Yggdrasil's roots and the mouth of Rótarhellir (dungeon 1), barred by fallen logs until M1c. Arnbjörg the pilgrim keeps vigil.",
  things: [
    { k: 'gate', at: { x: 19, y: 6 }, w: 2, h: 1, art: 'logs', closed: { k: 'all', of: [] } },
    {
      k: 'sign',
      at: { x: 23, y: 7 },
      text: {
        en: 'Rótarhellir. Here the roots of the World Tree break the ground.',
        sv: 'Rótarhellir. Här bryter Världsträdets rötter igenom marken.',
      },
    },
  ],
  map: [
    'PPTTPTTPPPPPPTPTPTPPTPPPPPPPPPPTPPTPPPPT',
    'PPTPPTTPPPPP#################PPTPPTTPTPP',
    'PPTPPPPPPPTP#################PTPTTPPTPTT',
    'PPPPTTPTPPPP#######,,########PPPPTPTPPTT',
    'PPPPTPPPPTPT#######,,########PPPPPTPPTTP',
    'PPTTPPPPPPPT#######,,########TTPPPPPPPTP',
    'TTTTPPPTTPPT#######,,########TPPPPPTPPPP',
    'TTPPP%.PPP.TP.T..T,,,,PM..PT%.%%.%TP.TPT',
    'TTT...........%...,,,,.............%TPTP',
    'PTPP%...............................PTTP',
    'PPTP................................%PTP',
    'TTTP................................%PPP',
    '............T.........%..............TPP',
    '...................%T.T..............PPP',
    '.....................................PPP',
    'TTP....%T......................%T....PPT',
    'PPT......T...........................PTP',
    'TPTP%..........%...%..T%......T.%..%PTTT',
    'PTP......%.....P%%.P%P.TT...%...P.%%PPPP',
    'PTTPPTPPTPPTPTPPPPPPTTPTT...TPPPTTTPTTPP',
    'PPPPPPPPPPPTTTTPPPTPPPPTP...PPPTPPPTPPPP',
    'TPTPPTPTPTPPPTPPTPTTPPPPP...PPPPPPPPPTTP',
  ],
};
