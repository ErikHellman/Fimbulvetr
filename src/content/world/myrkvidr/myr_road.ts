import type { ScreenDef } from '@core/world/screen';

export const myrRoad: ScreenDef = {
  id: 'myr_road',
  region: 'myrkvidr',
  purpose: 'The Myrkviðr road: Dagný the huntress camps by her fire; a vargr pack hunts along the road.',
  things: [
    { k: 'enemy', id: 'vargr', at: { x: 8, y: 6 } },
    { k: 'enemy', id: 'vargr', at: { x: 32, y: 15 } },
  ],
  /** Where the Myrkviðr spawn table may put foes (rolled by day and night, see content/spawns.ts). */
  spawns: [
    { x: 8, y: 10 },
    { x: 30, y: 8 },
    { x: 10, y: 15 },
    { x: 28, y: 13 },
    { x: 6, y: 6 },
  ],
  map: [
    'PPPPPTPPTPTPTTTTTP,,,,PPTPTPPPPPPPPPPPPP',
    'TPTTPTPTTTTTPPPTTP,,,,PTPTPPTTTTPPTPTPPP',
    'PPPPPPPTPPPTPTTPPP,,,,TPPTPPPPTPPTTPPTTT',
    'PPP%.T.P.P..%..P.%,,,,.P..%....%..PP.TTP',
    'TPP..T......%.....,,,,.%.....hh.....TPPP',
    'TPPP%%......T.....,,,,.......hh.....PPTT',
    'PTP...........T%..,,,,...............PPP',
    'PPP...............,,,,..............PPPP',
    'PPP%.......%T.....,,,,.T................',
    'PPT.........%...T.,,,,..................',
    '.....%............,,,,.%P%.......P......',
    '.....P%...........,,,,...............PPT',
    '.....%............,,,,..T.......TP%.%TPP',
    'TPPP..............,,,,%........T%...%TPT',
    'PPP...............,,,,T.............TPPP',
    'PPT...............,,,,...............PPP',
    'TTP...............,,,,..............%TPT',
    'TPPP%....%......%.,,,,..............%PTP',
    'PTPP.PPPTP%...%.P.,,,,%..%PP..%%%.TPTPTP',
    'PPTTPTPTTPPPPTPPTP,,,,PTPTPPTPPPPTPPPPTT',
    'PPPTPPPPTPPPTPPPTP,,,,PPPTPPPTPPTPPTPTPP',
    'PTPTTPTPTPPPPTTTTP,,,,PTTPPPPPPPPPPTPPPP',
  ],
};
