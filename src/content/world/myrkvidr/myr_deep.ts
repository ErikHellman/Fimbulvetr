import type { ScreenDef } from '@core/world/screen';

export const myrDeep: ScreenDef = {
  id: 'myr_deep',
  region: 'myrkvidr',
  purpose:
    'Deep Myrkviðr, old pines: the road north to Uppvík lies under a fallen pine until Önundr saws through it (st_road_open). Draugr walk here at night; in winter, drifts pile west of the road and east by the mound.',
  things: [
    {
      k: 'sign',
      at: { x: 18, y: 2 },
      w: 4,
      text: {
        en: 'The road north to Uppvík, the trading town.',
        sv: 'Vägen norrut mot Uppvík, handelsstaden.',
      },
    },
    /** The fallen pine across the road north, until Önundr saws it through. */
    {
      k: 'gate',
      at: { x: 18, y: 2 },
      w: 4,
      h: 1,
      art: 'logs',
      closed: { k: 'not', c: { k: 'flag', id: 'st_road_open' } },
    },
    // A leaf of Gyða's record (q_pages), in the drifts west of the road by the old mound.
    {
      k: 'chest',
      id: 'myr_c_leaf',
      at: { x: 11, y: 7 },
      gives: { item: 'rune_leaf' },
      when: { k: 'flag', id: 'st_blood_told' },
    },
    { k: 'enemy', id: 'vargr', at: { x: 10, y: 15 } },
    { k: 'enemy', id: 'draugr', at: { x: 29, y: 8 }, when: { k: 'phase', is: 'night' } },
  ],
  /** Where the Myrkviðr spawn table may put foes (rolled by day and night, see content/spawns.ts). */
  spawns: [
    { x: 8, y: 12 },
    { x: 28, y: 11 },
    { x: 6, y: 7 },
    { x: 30, y: 14 },
  ],
  map: [
    'PPPPTPPPPPPPPTTPPP,,,,PTPTPPPPPPTPPPTPPP',
    'PTPTPPPPPPPPPPPPPP,,,,TTTPTPPPTPTTPPPPTP',
    'PTTPPPTPPTPTPTPPPP,,,,TPPPTPPTTPTPPTPPTP',
    'PPTTTPPPTPTPTPPPPP,,,,TPPPPPPPPPPPTPPPPP',
    'PTTPPPPPPTPPTPPPTT,,,,TPPTPPTPPPTTTPPTPP',
    'PTPP.%.PT..PPT%PT.,,,,PTP..PP%%%..T%PPTT',
    'PPTPP....P^%^^....,,,,P..P.P.......%TTTP',
    'PPTPP...^^^^^^^...,,,,%....%.......TPPPP',
    'PPPP.....m........,,,,..............TTTP',
    'PTPT..............,,,,P%......%....PPPPP',
    'PPPPP.............,,,,.P......P.P...TPPP',
    '..................,,,,.%.....%...P..PPPP',
    '..............P...,,,,.P%...%PP.........',
    '....%.P........P%.,,,,P%.......%........',
    'PTPPP.%...........,,,,........%P........',
    'PPPP%...P%....P...,,,,..^^^^^.......TTPP',
    'TTTP%.............,,,,P^^^^^^.m....%PPPP',
    'TTPPP.P%...%.%P%..,,,,..%.%P..%...PTPTPP',
    'TPPPPPP.PT.T%%.T.P,,,,.%PP.PPPP.P.%.PPPT',
    'PPPPPPTTTPTPPTTTTP,,,,PTPTPPTTTPTPTPPPPT',
    'PPTTTTPTPPTPTPPPTT,,,,PPTPPPPTTPPPPPPPTP',
    'TPPPPTTPPPPPTTPPTP,,,,TPPPPPTTTPTPTPPTPP',
  ],
};
