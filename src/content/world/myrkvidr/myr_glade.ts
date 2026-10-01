import type { ScreenDef } from '@core/world/screen';

export const myrGlade: ScreenDef = {
  id: 'myr_glade',
  region: 'myrkvidr',
  purpose:
    'A glade east of the north road: a ring of white birches round an old standing stone. By night the huldra waits there. A path runs east out of it to the rockfall into Haugar.',
  things: [],
  /** Where the Myrkviðr spawn table may put foes (rolled by day and night, see content/spawns.ts). */
  spawns: [
    { x: 7, y: 11 },
    { x: 31, y: 11 },
    { x: 8, y: 15 },
    { x: 34, y: 15 },
  ],
  map: [
    'TPTPPPPPPPPPPPPPPPPTTPPPTTPPTPPPPTPPPTPP',
    'TPPPTPPPPTPPTPPTTTPPPPPTTPPTTPPPPPPPPTPT',
    'PPPPPTPTPPPPPTPPPTPPPTTPTPPTPPPTPPTPPPPP',
    'TPP........P.P......P..P..P.......P..TPP',
    'PPT......%.......BBBBBBB....P.....%..PPP',
    'PPPP."".........B.......B............PPP',
    'TPP.....P......B.........B...."".....TPP',
    'PTTP...........B.........B......"....PPT',
    '...P..........B...........B..........PTP',
    '...,,,,,,,,,,.B.....M.....B...P......PPT',
    '...P........,.B...........B........".PPP',
    'TPPP........,.B...........B..........TTP',
    'TPPP%.....B.,.B...........B..".......PPP',
    'TTPP..P.....,..B.........B...."....P.PPT',
    'PPT...."....,..B.........B..........PPPP',
    'PPPP...."...,...B.......B......B...."TPP',
    'PPPP........,....BB.,.BB....%...........',
    'PTT..."..B..,......,,,..................',
    'PTPPP.....PP,,,,,,,,,,,,,,,,,,,,,,,,,,,,',
    'PTPTPPPPPTPPPPPPPTPPPTTTTPPPTTPP.,.PPPPT',
    'PPPTPPPTTPTPPPPTPPPPPTPPTTPPTTPP.,.PTPTP',
    'PPPPPPPTPPTPPPPPPTPPPTPPTPPPPPTT.,.PPPPP',
  ],
};
