import type { ScreenDef, Thing } from '@core/world/screen';

/** Day 3: ravens on the barley until five have been scared off. */
const RAVENS: Thing[] = [
  [10, 8],
  [15, 6],
  [20, 10],
  [25, 7],
  [29, 12],
].map(([x = 0, y = 0]): Thing => ({
  k: 'critter',
  id: 'raven',
  at: { x, y },
  when: {
    k: 'all',
    of: [
      { k: 'flag', id: 'st_farm_day', eq: 3 },
      { k: 'flag', id: 'q_ravens', lt: 5 },
    ],
  },
  onGone: [{ k: 'add', flag: 'q_ravens', n: 1 }],
}));

export const askField: ScreenDef = {
  id: 'ask_field',
  region: 'askdalr',
  purpose:
    'The barley field where the ravens come down on day 3; stones along the path are there to throw. Once Tófa is home from Helgrind she sells over the fence at 8–10, 16.',
  things: [
    ...RAVENS,
    /** Tófa's stall over the fence, by day once she is home from Helgrind: flatbread and cheese. */
    {
      k: 'use',
      at: { x: 8, y: 16 },
      w: 3,
      script: 'shop_tofa',
      when: {
        k: 'all',
        of: [
          { k: 'flag', id: 'st_freed_tofa' },
          { k: 'not', c: { k: 'phase', is: 'night' } },
        ],
      },
    },
    { k: 'prop', id: 'stone', at: { x: 8, y: 17 } },
    { k: 'prop', id: 'stone', at: { x: 14, y: 17 } },
    { k: 'prop', id: 'pot', at: { x: 18, y: 17 } },
    { k: 'prop', id: 'stone', at: { x: 23, y: 17 } },
    { k: 'prop', id: 'stone', at: { x: 30, y: 17 } },
    { k: 'prop', id: 'pot', at: { x: 33, y: 17 } },
  ],
  map: [
    'TTTTTTTTTTTTTTTTTT,,,,TTTTTTTTTTTTTTTTTT',
    'T.................,,,,.................T',
    'T.................,,,,.................T',
    'T..T..............,,,,...............T.T',
    'T.....::::::::::::::::::::::::::::.....T',
    'T.....::::::::::::::::::::::::::::.....T',
    'T.T...::::::::::::::::::::::::::::.....T',
    'T.....::::::::::::::::::::::::::::.....T',
    'T.....::::::::::::::::::::::::::::.....T',
    'T.....::::::::::::::::::::::::::::,,,,,,',
    'T.....::::::::::::::::::::::::::::,,,,,,',
    'T.....::::::::::::::::::::::::::::,,,,,,',
    'T.....::::::::::::::::::::::::::::,,,,,,',
    'T.....::::::::::::::::::::::::::::.....T',
    'T.....::::::::::::::::::::::::::::.....T',
    'T.....::::::::::::::::::::::::::::.....T',
    'T.....======..============..======.....T',
    'T......................................T',
    'T..,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,..T',
    'T...................................T..T',
    'T..T................T..................T',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
};
