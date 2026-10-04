import type { ScreenDef } from '@core/world/screen';

export const nifGjoll: ScreenDef = {
  id: 'nif_gjoll',
  region: 'niflmyrr',
  purpose:
    "The Gjöll's bank: the river of the dead runs west between low black banks, crossed by a bridge of old bones. On the far bank a cairn stands beyond a black pool, out of reach until something can pull Ask across.",
  things: [],
  /** Where Niflmýrr's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 6, y: 10 },
    { x: 13, y: 16 },
    { x: 15, y: 15 },
  ],
  map: [
    '########################################',
    '###***6****5555****####****6****########',
    '##*********5555***######**********######',
    '#****i*****5555***************6*****####',
    '#**********5555******************6*****#',
    'vvvvvvvvvvvvvvvvvvppvvvvvvvvvvvvvvvvvvvv',
    'vvvvvvvvvvvvvvvvvvppvvvvvvvvvvvvvvvvvvvv',
    'vvvvvvvvvvvvvvvvvvppvvvvvvvvvvvvvvvvvvvv',
    'vvvvvvvvvvvvvvvvvvppvvvvvvvvvvvvvvvvvvvv',
    '#**6**************pp************6******#',
    '#*****************pp*******************#',
    '#**********6************6**************#',
    '#****55****************************6***#',
    '#***5555*******6*******5555************#',
    '*****55***************555555************',
    '**********************55555*******6*****',
    '****6******************555**************',
    '****************6***********************',
    '#*****6*************************6******#',
    '##*****************6**************6*####',
    '####*******6***************************#',
    '########################################',
  ],
};
