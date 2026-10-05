import type { ScreenDef } from '@core/world/screen';

export const saeWell: ScreenDef = {
  id: 'sae_well',
  region: 'saevatn',
  purpose:
    "The north water under the cliffs. In its middle the lake turns slowly round and round over something deep: a dive in the whirl at (22, 10), on a current that never freezes, goes down to Urðr's well.",
  things: [
    {
      k: 'door',
      at: { x: 22, y: 10 },
      dir: 's',
      to: 'sae_int_well',
      arrive: { x: 20, y: 15 },
      facing: 'n',
      dive: true,
    },
    {
      k: 'sign',
      at: { x: 6, y: 5 },
      text: {
        en: 'Scratched on a stone above the beach: three women at a loom, and under them a ring of water.',
        sv: 'Inristat i en sten ovanför stranden: tre kvinnor vid en vävstol, och under dem en ring av vatten.',
      },
    },
  ],
  /** Where Sævatn's spawn table may put foes (see content/spawns.ts). */
  spawns: [{ x: 4, y: 6 }],
  map: [
    '########################################',
    '########################################',
    '########################################',
    '#nnnnnKnnnnnnnny~~~~~~~~~~~~~~~~~~~~~~~#',
    '#nKnnnnnnnnnnnn~~~~~~~~~~~~~~~~~~~~~~~~~',
    '#nnnnnnnnyy~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '#nnnnnnnn~~~~~~~~~~~~~~~~~~~~~~~~##~~~~~',
    '#nnnnnnnn~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '#nnny~~~~~~~~~~~~~>>>>|~~~~~~~~~~~~~~~~~',
    '#nnny~~~~~~~~~~~~~/~~~|~~~~~~~~~~~~~~~~~',
    '#nnn~~~~~~~~~~~~~~/~~~|~~~~~~~~~~~~~~~~~',
    '#nnn~~~~~~~~~~~~~~/~~~|~~~~~~~~~~~~~~~~~',
    '#nnn~~~~~~~~~~~~~~/<<<<~~~~~~~~~~~~~~~~~',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#~~~~~~~~~',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#',
    '#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#',
  ],
};
