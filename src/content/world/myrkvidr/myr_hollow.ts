import type { ScreenDef } from '@core/world/screen';

export const myrHollow: ScreenDef = {
  id: 'myr_hollow',
  region: 'myrkvidr',
  purpose:
    'A dark hollow of old grave mounds; at night draugr climb out of them. A path leads north into the fen.',
  things: [
    /** Thorns across the old path north into the fen: only fire clears them (a shortcut once Eldr is known). */
    { k: 'prop', id: 'bramble', at: { x: 10, y: 2 } },
    { k: 'prop', id: 'bramble', at: { x: 11, y: 2 } },
    { k: 'prop', id: 'bramble', at: { x: 12, y: 2 } },
    {
      k: 'sign',
      at: { x: 22, y: 10 },
      text: {
        en: 'Here lie the first settlers of Askdalr. Let them sleep.',
        sv: 'Här vilar Askdalrs första nybyggare. Låt dem sova.',
      },
    },
    { k: 'enemy', id: 'draugr', at: { x: 20, y: 6 }, when: { k: 'phase', is: 'night' } },
    { k: 'enemy', id: 'draugr', at: { x: 27, y: 12 }, when: { k: 'phase', is: 'night' } },
  ],
  /** Where the Myrkviðr spawn table may put foes (rolled by day and night, see content/spawns.ts). */
  spawns: [
    { x: 8, y: 6 },
    { x: 30, y: 7 },
    { x: 12, y: 15 },
    { x: 32, y: 12 },
    { x: 6, y: 10 },
  ],
  map: [
    'TPPPTTPPTP...PPTPPPTTPPTPPPPTPTPPTPPPPPP',
    'PPPPPPTTPT...PPTPPTTTTPPPPPPPTPPPPTTPPTP',
    'PPPPPTTPPT...PPPPPTPPPPPTPPPPPPTPPPPPTPP',
    'TTTPPPTTPP...PPPPPPPPTTPPPTTTPTTPPPPPPTP',
    'PPPP%..%.P..%..PP.%.PT.P.%P.%P%PT%%PTTPP',
    'PPPPP....................%P.........PPPP',
    'PTPTP%.......%P.....m.....%.P.T%T...PPTP',
    'PPPT.....%....%...........%P.P..%..%PPPP',
    'PPPPP...%P%.m.......%....T.%.%.....%TPPP',
    'PPPPP%.....T%......%P%..............PPTP',
    'PPPT%.......%P%.....%.M.............PTTT',
    'TPTTT%..................................',
    'PPPT.....P%....%.........%.m............',
    'PPPPT..........P.....%...P%.TP..........',
    'PPPP............m....P%.%P..%%....%.PTTP',
    'PPPP%.............%......%.......%P.PTPP',
    'PTTPT.%%......%...P..............P.%TTPT',
    'PTPT.%PP...%T%P..%%%.P.%..TP%%%TP.P%PPPP',
    'TPPTPPPT...TPPPTPTTPPPPPPPPTPPTTPTPPTTPT',
    'PPTPTPPP...PPPPPPTPTTPPPPPPPTTPPPPPTPPTT',
    'PPPPPPPP...PPPPTPTTTPPPPPTTPTPPPPPPPPTPP',
    'PTTPPPTP...TPPPPPTPPPTTPPPTTPPTPPTTPTPPT',
  ],
};
