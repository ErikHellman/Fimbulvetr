import type { ScreenDef } from '@core/world/screen';

export const myrRoad: ScreenDef = {
  id: 'myr_road',
  region: 'myrkvidr',
  purpose:
    'The Myrkviðr road: Dagný the huntress camps by her fire; a vargr pack hunts along the road. In a nook between the trees at the north-west (6, 3) a Norn-thread hangs behind a web that only Vindr tears away (M7b).',
  things: [
    /** A bauta-stone with one of the fallen huscarls' names (`q_record`, M11a). */
    {
      k: 'use',
      at: { x: 16, y: 7 },
      script: 'bauta_myr',
    },
    { k: 'enemy', id: 'vargr', at: { x: 8, y: 6 } },
    { k: 'enemy', id: 'vargr', at: { x: 32, y: 15 } },
    /** The Norns' Myrkviðr thread (`q_loom`), behind a web that only a Vindr gust tears away. */
    {
      k: 'gate',
      at: { x: 6, y: 4 },
      w: 1,
      h: 1,
      art: 'web',
      closed: { k: 'not', c: { k: 'flag', id: 'w_myr_web' } },
      blows: 'w_myr_web',
    },
    { k: 'chest', id: 'myr_c_thread', at: { x: 6, y: 3 }, gives: { item: 'norn_thread' } },
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
    'PPP.............M.,,,,..............PPPP',
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
