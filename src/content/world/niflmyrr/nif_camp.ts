import type { ScreenDef } from '@core/world/screen';
import { evening } from '../../dialogue/util';

export const nifCamp: ScreenDef = {
  id: 'nif_camp',
  region: 'niflmyrr',
  purpose:
    "The drained camp on the Gjöll's bank: tents left standing, a ring of flags where the thralls were bled, and the river running black and fast past it. Here the truth about the captives comes out. By night the skald keeps a fire in the stone ring.",
  /** Bragi's fire, lit from evening to dawn (he sits north of it). */
  things: [{ k: 'fire', at: { x: 35, y: 13 }, w: 1, h: 1, when: evening }],
  /** Where Niflmýrr's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 32, y: 11 },
    { x: 16, y: 14 },
    { x: 30, y: 18 },
  ],
  map: [
    '############################vvvv########',
    '############################vvvv########',
    'vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv########',
    'vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv*****###',
    '#**y****6*******y*********y*******6**###',
    '#*************************************##',
    '#*6****&&&**********&&&*********6******#',
    '#******&&&****jjjj**&&&****************#',
    '#************jjjjjj*********&&&****6***#',
    '************jjjjjjjj********&&&********#',
    '************jjjjjjjj*******************#',
    '************jjjjjjjj*******************#',
    '#*6**********jjjjjj********6************',
    '#*************jjjj**********************',
    '#****&&&*****************6**************',
    '#****&&&********************************',
    '#**************6*****ggg***************#',
    '#6*******ggg********ggggg******6*******#',
    '#*******ggggg*******ggg****************#',
    '#********ggg*********************6*****#',
    '###****6**********6*******6***#######**#',
    '########################################',
  ],
};
