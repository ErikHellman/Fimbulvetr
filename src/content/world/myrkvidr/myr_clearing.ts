import type { ScreenDef } from '@core/world/screen';

export const myrClearing: ScreenDef = {
  id: 'myr_clearing',
  region: 'myrkvidr',
  purpose: "Önundr the woodcutter's clearing and hut; leaf piles under the trees.",
  things: [
    { k: 'door', at: { x: 21, y: 8 }, dir: 'n', to: 'myr_int_hut', arrive: { x: 19, y: 15 }, facing: 'n' },
  ],
  map: [
    'PTPPTPTT...PPPPPPPTPPPTTTPTPPPPPPPPTPPTP',
    'PTTPPPPP...PPPTPPPPPPPPPPTPPPPPPTPTPPPPP',
    'TPTTPPPP...PPTPTPPTPPPPPTPPPTPTTPPPTPPTP',
    'PTP........PPPPT...P..T......P.....P.PTP',
    'PTP..............RRRRRRRRR..........PPTT',
    'PPP..............RRCRRRRRR..........PPPP',
    'PPT..............RRRRRRRRR...........TTT',
    'PPT.........S....RRRRRRRRR..........TTPT',
    'TPTP.............WW+WDW+WW...........TPP',
    'PPP..................................PTT',
    'PPTP....................................',
    'PPP...............T.....................',
    'PTP.....S........%%............T.%T%....',
    'TTP.........%....T%...............%..PPP',
    'PTT........%T....%...........S.......TPP',
    'PPP........T........................%TTP',
    'PPT%.......%.................T.......TPP',
    'PTPP%..................T.....%......PTPT',
    'TTT..T.%.P%...%T%%%T......%%....%P..%PPP',
    'PPPTPPPTPTTT...TPPPPPPPPPPPTPPPTTPPPPPPP',
    'TPPPPPPPPTPP...PPPTPPTTPTPTPTPPTPPPPPPPT',
    'PPPPPPTTPPPP...TPPPTPPTPPPPPPPPPTTPPPTPT',
  ],
};
