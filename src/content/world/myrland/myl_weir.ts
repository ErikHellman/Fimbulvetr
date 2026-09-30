import type { ScreenDef } from '@core/world/screen';

export const mylWeir: ScreenDef = {
  id: 'myl_weir',
  region: 'myrland',
  purpose:
    "Where the forest brook tumbles down into Mýrland. A drawbridge over the rapids is hauled up on the far bank; its latch is out of any blade's reach, but not a boomerang's. The rapids never freeze.",
  things: [
    {
      k: 'sign',
      at: { x: 32, y: 3 },
      text: {
        en: 'The weir. Mýrland lies over the water. Strike the latch to lower the bridge.',
        sv: 'Dammen. Mýrland ligger på andra sidan vattnet. Slå till spärren för att fälla ner bron.',
      },
    },
    /** The drawbridge: down once its latch on the far bank has been struck. */
    { k: 'bridge', at: { x: 24, y: 6 }, w: 4, h: 2, down: { k: 'flag', id: 'w_myl_bridge' } },
    /** The latch, six tiles over the rapids: only the boomerang reaches it. */
    { k: 'switch', at: { x: 22, y: 4 }, set: 'w_myl_bridge' },
    /** Over the bridge: Mýrland. */
    {
      k: 'trigger',
      at: { x: 20, y: 1 },
      w: 1,
      h: 10,
      script: 'myl_arrive',
      when: { k: 'not', c: { k: 'flag', id: 'st_myrland_reached' } },
    },
  ],
  /** Where Mýrland's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 6, y: 4 },
    { x: 14, y: 10 },
  ],
  map: [
    'BTTBTTTTBBTTTBTTBTTBBTTTvvvvBTBBTT,,,BBB',
    'T.BBBT".BT....TB..".....vvvv.......,.TTB',
    'T......"................vvvv.....".,.TTT',
    'T..y.yy........"........vvvv....M..,.TTT',
    'T........y.....".".."...vvvv.......,.TTT',
    'T.............."."..."..vvvv......",.BBT',
    'T.......................vvvv,,,,,,,,.BTT',
    ',,,,,,,,,,,,,,,,,,,,,,,,vvvv,,,,,,,,.TTT',
    ',,,,,,,,,,,,,,,,,,,,,,,,vvvv.."......TTT',
    ',,,,,,,,,,,,,,,,,,,,,,,,vvvv......"..TTB',
    '........................vvvv.........BTT',
    'vvvvvvvvvvvvvvvvvvvvvvvvvvvvTTBTTTTTBTTT',
    'vvvvvvvvvvvvvvvvvvvvvvvvvvvvTBTTBTTTTTTT',
    'vvvvvvvvvvvvvvvvvvvvvvvvvvvvTBTTBTTTTTTT',
    'vvvvvvvvvvvvvvvvvvvvvvvvvvvvTBBBTTTTTBTT',
    'vvvvvvvvvvvvvvvvvvvvvvvvvvvvBBBTBBTTBBTB',
    'BTTTTBTTBBTTBTTBBBTBTTTBTTTBTTTTTBBTTTTT',
    'TTTBBTBTTTBTTTTTTBTTBBTBTTTTBBTTTTBTTTTT',
    'TTTBTBBTBTTTTTBTTTTBTBBBTTTTTTTTBBBTTTTB',
    'TTBTBBTBBTTBBBTBTTTTBBTBTBBTBTTTBTTTBBTT',
    'TTTBTTBBBTTTTTTTTTTTTTTTTBBBBTBBTBTTTBTT',
    'BTBTTTTBTTBTBTBTTTTTTTBTBTTBBTTTTTTTTBBT',
  ],
};
