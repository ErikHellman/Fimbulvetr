import type { ScreenDef, Thing } from '@core/world/screen';
import { raidNight } from '../../dialogue/util';

/** The raid night: walls of fire close the yard except the road north to the gate. */
const RAID: Thing[] = [
  { k: 'gate', at: { x: 0, y: 9 }, w: 1, h: 4, art: 'fire', closed: raidNight },
  { k: 'gate', at: { x: 39, y: 9 }, w: 1, h: 4, art: 'fire', closed: raidNight },
  { k: 'gate', at: { x: 18, y: 21 }, w: 4, h: 1, art: 'fire', closed: raidNight },
  { k: 'fire', at: { x: 4, y: 8 }, w: 4, h: 1, when: raidNight },
  { k: 'fire', at: { x: 29, y: 13 }, w: 3, h: 1, when: raidNight },
  { k: 'fire', at: { x: 12, y: 15 }, w: 2, h: 1, when: raidNight },
  { k: 'fire', at: { x: 34, y: 10 }, w: 2, h: 1, when: raidNight },
  { k: 'enemy', id: 'draugr', at: { x: 14, y: 14 }, when: raidNight },
  { k: 'enemy', id: 'draugr', at: { x: 28, y: 10 }, when: raidNight },
  { k: 'enemy', id: 'troll', at: { x: 30, y: 15 }, when: raidNight },
];

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
      w: 2,
      h: 2,
      text: { en: 'The well. Cold, deep and sweet.', sv: 'Brunnen. Kall, djup och söt.' },
    },
    ...LOGS,
    ...RAID,
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
    ',,,,;;;;;;;;;;;;;;;;;;;;OO;;;;;;;,,,,,,,',
    ',,,,;;;;;;;;;;;;;;;;;;;;OO;;;;;;;,,,,,,,',
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
