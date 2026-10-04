import type { ScreenDef } from '@core/world/screen';

export const nifJars: ScreenDef = {
  id: 'nif_jars',
  region: 'niflmyrr',
  purpose:
    'Where the marsh-folk hung jars on poles to catch the lights of the dead. A rockfall hides a cave in the low crag; the path south goes down into the dead wood.',
  things: [
    { k: 'crack', id: 'nif_k_jars', at: { x: 23, y: 12 }, w: 1, h: 1, art: 'rock' },
    { k: 'door', at: { x: 23, y: 12 }, dir: 'n', to: 'nif_int_cave', arrive: { x: 19, y: 14 }, facing: 'n' },
  ],
  /** Where Niflmýrr's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 18, y: 18 },
    { x: 35, y: 11 },
    { x: 35, y: 16 },
  ],
  map: [
    '########################################',
    '####****6*****######*******6*****#######',
    '###************####****************#####',
    '##****6*****************6*********######',
    '#******************************6*******#',
    'vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv',
    'vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv',
    'vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv',
    'vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv',
    '#**************************************#',
    '#*****6***********##########*****6*****#',
    '#****************############*********##',
    '****************#####QQV######*********#',
    '*******6*******#####***********6*******#',
    '***************####*************6*******',
    '*****************#**********************',
    '#****6*************************6********',
    '##*******************6****************#*',
    '###**********6****************6******###',
    '####*******************6*************###',
    '#####***6*****************************##',
    '##############################****######',
  ],
};
