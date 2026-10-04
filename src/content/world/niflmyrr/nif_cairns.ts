import type { ScreenDef } from '@core/world/screen';

export const nifCairns: ScreenDef = {
  id: 'nif_cairns',
  region: 'niflmyrr',
  purpose:
    'Sunken cairns: the old dead were laid in a pool here, and their stones stand out of the black water. The Gjöll turns south under a plank bridge, down towards the camp.',
  /**
   * In a ring of cairns on the islet in the still pool, open only from the east (no boomerang line reaches it):
   * Ís (or winter) lays a floor of ice out to it.
   */
  things: [{ k: 'piece', id: 'hp_nif_cairns', at: { x: 17, y: 9 } }],
  /** Where Niflmýrr's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 6, y: 13 },
    { x: 33, y: 16 },
    { x: 13, y: 14 },
  ],
  map: [
    '########################################',
    '#####***6*******######***6*******#######',
    '###********i**************************##',
    '##****i**********6*********i***********#',
    '#*********************6****************#',
    '#***i*******************6***vvvvvvvvvvvv',
    '#***********~~~~~~~~~~~*****vvvvvvvvvvvv',
    '##***6******~~~~~~~~~~~*****vvvvvvvvvvvv',
    '##**********~~**iii**~~*****vvvvvvvvvvvv',
    '#***********~~**i**i*~~*****vvvv*******#',
    '************~~**ii***~~****6vvvv***6***#',
    '************~~~~~~~i~~~****vvvv********#',
    '****6********~~~~~~~~~****pppppppp******',
    '*********i*****************pppppp*******',
    '#******************6********vvvv********',
    '#***************************vvvv****6***',
    '##*****6*******i************vvvv*******#',
    '###*************************vvvv*****i*#',
    '###****6*************6******vvvv*******#',
    '####************************vvvv***6***#',
    '#####*******i******6********vvvv****####',
    '############################vvvv########',
  ],
};
