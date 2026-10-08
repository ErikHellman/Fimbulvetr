import type { ScreenDef } from '@core/world/screen';

export const nifDeadwood: ScreenDef = {
  id: 'nif_deadwood',
  region: 'niflmyrr',
  purpose:
    "The dead wood: grey snags standing in the mire as far as the fog lets anyone see. A skald's cairn marks the old way. Out in the black pool to the north-west lies an islet that no path reaches, unless the fog is burned away.",
  /** On the islet in the north-west pool, at the end of the drowned path that only light shows. */
  things: [{ k: 'piece', id: 'hp_nif_deadwood', at: { x: 8, y: 4 } }],
  /** Where Niflmýrr's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 34, y: 6 },
    { x: 4, y: 13 },
    { x: 20, y: 17 },
  ],
  map: [
    '##############################****######',
    '##############################****######',
    '##555555555555**6***6****6***6****6**###',
    '#55555555555555**6*****6****6***6****###',
    '#555555***555555****6****6****6***6***##',
    '#55555*****55555**6*****6***6***6*******',
    '#55555**i**55555*****6****6*****6*******',
    '#555555***555555**6****ggg****6*********',
    '#5555555-55555555****6gggggg**6**6******',
    '##555555-55555555*6****gggg**6****6***##',
    '###55555-5555555*****6****6*****6****###',
    '###**555-5555555**6****6*****6****6**###',
    '*#****55-555555***********6****6*******#',
    '*********55555**6***6***i****6****6***##',
    '**6***6*****6******6*****6*****6****####',
    '******6***6****6***6***6****6***6***####',
    '#***6****6***6***6***6***6****6***6*####',
    '##*6****6****6*****6****6****6****6*####',
    '###***6***6*****6*****6****6****6***####',
    '####**********6*****6*****6*****6**#####',
    '########################################',
    '########################################',
  ],
};
