import type { ScreenDef } from '@core/world/screen';
import { all, flag, not } from '../../dialogue/util';

export const nifShore: ScreenDef = {
  id: 'nif_shore',
  region: 'niflmyrr',
  purpose:
    "Where the Gjöll runs into Sævatn: a pale strand, a seal-hunter's turf hut, and the lake going out grey into the fog towards Holmr. The far shore is for later; for now the strand is as far as anyone walks.",
  things: [
    { k: 'door', at: { x: 19, y: 9 }, dir: 'n', to: 'nif_int_hut', arrive: { x: 19, y: 14 }, facing: 'n' },
    /** Hrafn's marbendill (M7a): one a night on the strand while Ask guards his nets, three nights in all. */
    {
      k: 'enemy',
      id: 'marbendill',
      at: { x: 8, y: 12 },
      when: all(
        flag('q_sealskin_asked'),
        not(flag('q_sealskin_done')),
        not(flag('ev_seal_tonight')),
        { k: 'flag', id: 'q_seal_nights', lt: 3 },
        { k: 'phase', is: 'night' },
      ),
      onDeath: [
        { k: 'add', flag: 'q_seal_nights', n: 1 },
        { k: 'set', flag: 'ev_seal_tonight', value: true },
      ],
    },
  ],
  /** Where Niflmýrr's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 27, y: 13 },
    { x: 23, y: 16 },
    { x: 34, y: 9 },
  ],
  map: [
    '########################################',
    '########################################',
    '#~~~~~~~~~~vvvvvvvvvvvvvvvvvvvvvvvvvvvvv',
    '#~~~~~~~~~~vvvvvvvvvvvvvvvvvvvvvvvvvvvvv',
    '#~~~~~~~~nnn***y****6*******y*****6****#',
    '#~~~~~~~nnnn***************************#',
    '#~~~~~~nnnnn****RRRRRR*********6*******#',
    '#~~~~~~nnnnnn***RRCRRR*****************#',
    '#~~~~~nnnnnnn***RRRRRR***************y*#',
    '#~~~~~nnnnnnn***WW+DWW******************',
    '#~~~~nnnnnnnn***************************',
    '#~~~~nnnnnnnnn*********6****************',
    '#~~~~nnnnnnnnn*************************#',
    '#~~~~~nnnnnnnnn*****6*********6********#',
    '#~~~~~nnnnnnnnn************************#',
    '#~~~~~~nnnnnnnn*****y******ggg****6****#',
    '#~~~~~~nnnnnnn**6**********gggg********#',
    '#~~~~~~~nnnnnn**************gg****y****#',
    '#~~~~~~~~nnnnn****6********************#',
    '#~~~~~~~~~nnnn***********6******6******#',
    '#~~~~~~~~~~nnn#######*********##########',
    '########################################',
  ],
};
