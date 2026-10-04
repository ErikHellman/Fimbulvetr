import type { ScreenDef } from '@core/world/screen';

export const nifShore: ScreenDef = {
  id: 'nif_shore',
  region: 'niflmyrr',
  purpose:
    "Where the Gjöll runs into Sævatn: a pale strand, a seal-hunter's turf hut, and the lake going out grey into the fog towards Holmr. The far shore is for later; for now the strand is as far as anyone walks.",
  things: [
    { k: 'door', at: { x: 19, y: 9 }, dir: 'n', to: 'nif_int_hut', arrive: { x: 19, y: 14 }, facing: 'n' },
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
