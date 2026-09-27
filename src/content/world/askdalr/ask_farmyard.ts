import type { ScreenDef, Thing } from '@core/world/screen';

/** Day 2: logs by the chopping block, present until enough are split. Each split log counts once. */
const LOGS: Thing[] = [
  ...[
    [6, 13],
    [7, 14],
    [9, 14],
    [10, 13],
  ].map(([x = 0, y = 0]): Thing => ({
    k: 'prop',
    id: 'log_small',
    at: { x, y },
    when: {
      k: 'all',
      of: [
        { k: 'flag', id: 'st_farm_day', eq: 2 },
        { k: 'flag', id: 'q_logs', lt: 5 },
      ],
    },
    onBreak: [{ k: 'add', flag: 'q_logs', n: 1 }],
  })),
  ...[
    [5, 11],
    [11, 11],
  ].map(([x = 0, y = 0]): Thing => ({
    k: 'prop',
    id: 'log_big',
    at: { x, y },
    when: {
      k: 'all',
      of: [
        { k: 'flag', id: 'st_farm_day', eq: 2 },
        { k: 'flag', id: 'q_logs', lt: 5 },
      ],
    },
    onBreak: [{ k: 'add', flag: 'q_logs', n: 1 }],
  })),
];

export const askFarmyard: ScreenDef = {
  id: 'ask_farmyard',
  region: 'askdalr',
  purpose:
    "Halvar's farm: the longhouse, the well and trough for the water chore (day 1) and the chopping block for the firewood chore (day 2). Every road in Askdalr meets here.",
  things: [
    {
      k: 'door',
      at: { x: 9, y: 7 },
      dir: 'n',
      to: 'ask_int_longhouse',
      arrive: { x: 19, y: 19 },
      facing: 'n',
    },
    {
      k: 'prop',
      id: 'pail',
      at: { x: 26, y: 9 },
      when: {
        k: 'all',
        of: [
          { k: 'flag', id: 'st_farm_day', eq: 1 },
          { k: 'flag', id: 'q_water_d1', eq: false },
        ],
      },
    },
    {
      k: 'drop',
      at: { x: 22, y: 13 },
      w: 5,
      h: 2,
      accepts: 'pail',
      do: [{ k: 'set', flag: 'q_water_d1', value: true }],
    },
    {
      k: 'sign',
      at: { x: 24, y: 9 },
      text: { en: 'The well. Cold, deep and sweet.', sv: 'Brunnen. Kall, djup och söt.' },
    },
    ...LOGS,
  ],
  map: [
    'TTTTTTTTTTTTTTTTTT,,,,TTTTTTTTTTTTTTTTTT',
    'T.................,,,,.................T',
    'T..RRRRRRRRRRRRRR.,,,,.................T',
    'T..RRRRRRRRRRRRRR.,,,,T...======...T...T',
    'T..RRRRRRRRRRRRRR.,,,,....=::::=.......T',
    'T..RRRRRRRRRCRRRR.,,,,....=::::=.......T',
    'T..RRRRRRRRRRRRRR.,,,,....=::::=.......T',
    'T..WWWW+WDW+WWWWW.,,,,.................T',
    'T..;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;......T',
    ',,,,;;;;;;;;;;;;;;;;;;;;O;;;;;;;;,,,,,,,',
    ',,,,;;;;;;;;;;;;;;;;;;;;;;;;;;;;;,,,,,,,',
    ',,,,;;;;;;;;;;;;;;;;;;;;;;;;;;;;;,,,,,,,',
    ',,,,;;;;S;;;;;;;;;;;;;;UUU;;;;;;;,,,,,,,',
    'T..;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;......T',
    'T..;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;......T',
    'T..;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;......T',
    'T.................,,,,....""""""....T..T',
    'T.......""""""....,,,,...."""""".......T',
    'T...T...""""""....,,,,....""""""..T....T',
    'T.....T.""""""....,,,,.................T',
    'T.................,,,,.................T',
    'TTTTTTTTTTTTTTTTTT,,,,TTTTTTTTTTTTTTTTTT',
  ],
};
