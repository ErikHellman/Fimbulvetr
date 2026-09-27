import type { ScreenDef } from '@core/world/screen';

export const myrRoadS: ScreenDef = {
  id: 'myr_road_s',
  region: 'myrkvidr',
  purpose: 'The road from the Askdalr gate into Myrkviðr: the first vargr, a warning stone.',
  things: [
    {
      k: 'sign',
      at: { x: 16, y: 5 },
      text: {
        en: 'Myrkviðr. Keep to the road, and keep your lantern lit.',
        sv: 'Myrkviðr. Håll dig till vägen, och håll lyktan tänd.',
      },
    },
    { k: 'enemy', id: 'vargr', at: { x: 28, y: 8 } },
  ],
  map: [
    'PPTPPTPPPTPPPPPTPP,,,,PTPPPPPPTTTPPPPTTP',
    'TTTTPPPPTPPPTPPPTT,,,,PTPPTPTPPPTTPPTPTT',
    'TPPPPPPPPPPTPPTPPP,,,,PPTPPPPTPPPPPPPTTT',
    'PPPPPPTPTTPPTPPPPP,,,,TPPPPPPPPPPTPPPPPP',
    'PTTP..P%%.P.PP%..%,,,,%P.%T.T%TP%%P%TPPP',
    'PPPT%.....T%%%%.M.,,,,......%..%...%PTPP',
    'TPTT.........TP%..,,,,.............%TPPP',
    'PPPP..........%...,,,,.............%PTTT',
    'PPPP..............,,,,....%.........TPPP',
    '...........%.T%...,,,,....P........%PTPT',
    '...........T.%....,,,,....%...P%....PPPP',
    '........%T%.......,,,,....%.....%T.PTPPT',
    '.........%........,,,,....PT.....%..PPPT',
    'PPTP..............,,,,..T%.%.......%PPPT',
    'PTPT..............,,,,..................',
    'PPPP%.............,,,,..................',
    'TPPTP...P%...%%...,,,,..........T%......',
    'PTPT..P..%..PPPPP.,,,,%PP.%P...P...%PPPP',
    'PPTPPPPPPTTPTPTPTT,,,,PPPPPPTPPPPPPTTPPT',
    'TPTPPPTTTPPPPPPPPP,,,,PPPPPPPPPTTPPPPPTP',
    'PPPTTTPTPPPPPPPPPP,,,,TPPTTTPTPPPPPPPTTP',
    'PPPPPTTPPPPPTPPTTP,,,,PPTTPTPPPPPPPTPPTT',
  ],
};
