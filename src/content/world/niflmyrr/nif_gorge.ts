import type { ScreenDef } from '@core/world/screen';

export const nifGorge: ScreenDef = {
  id: 'nif_gorge',
  region: 'niflmyrr',
  purpose:
    "The gorge's far end, where the rime gave way: the stone road climbs out of the cliffs into Niflmýrr's first fog. Niflmýrr's warp stone stands on the old flags, and the marsh opens west.",
  things: [
    { k: 'warp', region: 'niflmyrr', at: { x: 20, y: 10 }, arrive: { x: 20, y: 11 } },
    /** Out of the gorge: Ask has reached Niflmýrr. */
    {
      k: 'trigger',
      at: { x: 17, y: 13 },
      w: 8,
      h: 2,
      script: 'nif_arrive',
      when: { k: 'not', c: { k: 'flag', id: 'st_niflmyrr_reached' } },
    },
  ],
  /** Where Niflmýrr's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 5, y: 7 },
    { x: 24, y: 3 },
    { x: 34, y: 9 },
  ],
  map: [
    '########################################',
    '########################################',
    '#########***6*****#####*****6**#########',
    '#######****555*******#*****5555****#####',
    '#####***6**55555*****6****555555**6*####',
    '####*******5555****jjjj****5555******###',
    '###**y*******55**jjjjjjjj****55***y***##',
    '###****ggg*******jjjjjjjj************###',
    '##****ggggg*****jjjjjjjjjj*****K*****###',
    '************jjjjjjjjjjjjjjjj****y****###',
    '************jjjjjjjjjjjjjjjj*********###',
    '************jjjjjjjjjjjjjjjj****6****###',
    '************jjjjjjjjjjjjjjjj*********###',
    '##**6****ggg****jjjjjjjjjj****ggg****###',
    '###*****ggggg****jjjjjjjj****ggggg**####',
    '####*****ggg*****jjjjjjjj*****ggg***####',
    '#####**6******#####jjjj#####***6***#####',
    '#######****#######jjjjjj#######***######',
    '##################jjjj##################',
    '##################jjjj##################',
    '##################jjjj##################',
    '##################jjjj##################',
  ],
};
