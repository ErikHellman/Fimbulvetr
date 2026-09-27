import type { ScreenDef } from '@core/world/screen';

export const myrRoots: ScreenDef = {
  id: 'myr_roots',
  region: 'myrkvidr',
  purpose:
    "Yggdrasil's roots and the mouth of Rótarhellir (dungeon 1). Arnbjörg the pilgrim keeps vigil. Paths lead north to the glade and east into the troll wood.",
  things: [
    { k: 'door', at: { x: 19, y: 2 }, dir: 'n', to: 'd1_r01', arrive: { x: 19, y: 19 }, facing: 'n' },
    { k: 'door', at: { x: 20, y: 2 }, dir: 'n', to: 'd1_r01', arrive: { x: 20, y: 19 }, facing: 'n' },
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
    'PPTTPTTPPPPPPTPTPTPPTPPPPPPPPPPT...PPPPT',
    'PPTPPTTPPPPP#################PPT...TPTPP',
    'PPTPPPPPPPTP#######VV########PTP...PTPTT',
    'PPPPTTPTPPPP#######,,########PPP...TPPTT',
    'PPPPTPPPPTPT#######,,########PPP...PPTTP',
    'PPTTPPPPPPPT#######,,########TTP...PPPTP',
    'TTTTPPPTTPPT#######,,########TPP...TPPPP',
    'TTPPP%.PPP.TP.T..T,,,,PM..PT%.%%...P.TPT',
    'TTT...........%...,,,,.............%TPTP',
    'PTPP%...............................PTTP',
    'PPTP................................%PTP',
    'TTTP................................%PPP',
    '............T.........%.................',
    '...................%T.T.................',
    '........................................',
    'TTP....%T......................%T....PPT',
    'PPT......T...........................PTP',
    'TPTP%..........%...%..T%......T.%..%PTTT',
    'PTP......%.....P%%.P%P.TT...%...P.%%PPPP',
    'PTTPPTPPTPPTPTPPPPPPTTPTT...TPPPTTTPTTPP',
    'PPPPPPPPPPPTTTTPPPTPPPPTP...PPPTPPPTPPPP',
    'TPTPPTPTPTPPPTPPTPTTPPPPP...PPPPPPPPPTTP',
  ],
};
