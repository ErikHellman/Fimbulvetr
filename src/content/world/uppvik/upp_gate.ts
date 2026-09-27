import type { ScreenDef } from '@core/world/screen';

export const uppGate: ScreenDef = {
  id: 'upp_gate',
  region: 'myrkvidr',
  purpose:
    "Uppvík's palisade gate on the road from Myrkviðr. Shut from 22:00 till 05:00: knock and Bersi lets Ask in or out. Arriving marks Uppvík reached.",
  things: [
    /** The town gate: shut at night. */
    { k: 'gate', at: { x: 18, y: 12 }, w: 4, h: 1, art: 'palisade', closed: { k: 'phase', is: 'night' } },
    /** Knocking at night, from outside or inside. */
    { k: 'use', at: { x: 18, y: 13 }, w: 4, script: 'upp_knock_in', when: { k: 'phase', is: 'night' } },
    { k: 'use', at: { x: 18, y: 11 }, w: 4, script: 'upp_knock_out', when: { k: 'phase', is: 'night' } },
    {
      k: 'trigger',
      at: { x: 18, y: 16 },
      w: 4,
      h: 2,
      script: 'uppvik_arrive',
      when: { k: 'not', c: { k: 'flag', id: 'st_uppvik_reached' } },
    },
    {
      k: 'sign',
      at: { x: 16, y: 14 },
      text: {
        en: 'Uppvík. The gate is shut from dark till dawn; knock, and the warden may open it.',
        sv: 'Uppvík. Porten är stängd från mörker till gryning; knacka, så öppnar vakten kanske.',
      },
    },
  ],
  map: [
    'IIIIIIIIIIIIIIIIppppppppIIIIIIIIIIIIIIII',
    'I...............pppppppp...............I',
    'I...T...........pppppppp...............I',
    'I...............pppppppp..........T....I',
    'I...............pppppppp...............I',
    'I.....UUU.......pppppppp............T..I',
    'I...............pppppppp...............I',
    'I...............pppppppp.RRRRRRR.......I',
    'I..........T....pppppppp.RRRRRRR.......I',
    'I...............pppppppp.RRRRRRR.......I',
    'I...............pppppppp.WW+WdWW.......I',
    'I...............pppppppp...............I',
    'IIIIIIIIIIIIIIIIII,,,,IIIIIIIIIIIIIIIIII',
    'PPPP..............,,,,..............PPPT',
    'PPPT............S.,,,,..............TTTP',
    'TPTT..............,,,,.....T........PPTP',
    'TPPP....T.........,,,,..............PPPP',
    'TPTP..............,,,,..............PPTP',
    'PTPT..............,,,,.........T....PPPP',
    'PTPT........T.....,,,,..............TPPP',
    'TPTP..............,,,,..............TPPP',
    'PPPPTTTPTPTTPTTPPP,,,,PTPTPPTTTTPPPPPPTP',
  ],
};
