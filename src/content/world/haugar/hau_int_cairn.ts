import type { ScreenDef } from '@core/world/screen';

export const hauIntCairn: ScreenDef = {
  id: 'hau_int_cairn',
  region: 'haugar',
  purpose:
    "Inside the great cairn: an old chieftain's grave-goods, a quiver among them, and arrows in the pots.",
  indoor: true,
  dark: true,
  things: [
    { k: 'door', at: { x: 19, y: 15 }, dir: 's', to: 'hau_cairns', arrive: { x: 10, y: 11 }, facing: 's' },
    { k: 'chest', id: 'hau_c_quiver', at: { x: 19, y: 8 }, gives: { item: 'quiver' } },
    // A leaf of Gyða's record (q_pages), in the dark of the cairn.
    {
      k: 'chest',
      id: 'hau_c_leaf',
      at: { x: 22, y: 11 },
      gives: { item: 'rune_leaf' },
      when: { k: 'flag', id: 'st_blood_told' },
    },
    { k: 'prop', id: 'arrow_pot', at: { x: 15, y: 8 } },
    { k: 'prop', id: 'arrow_pot', at: { x: 24, y: 8 } },
  ],
  map: [
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXX88888888888888XXXXXXXXXXXXX',
    'XXXXXXXXXXXXX87777777777778XXXXXXXXXXXXX',
    'XXXXXXXXXXXXX87777777777778XXXXXXXXXXXXX',
    'XXXXXXXXXXXXX87777777777778XXXXXXXXXXXXX',
    'XXXXXXXXXXXXX87777777777778XXXXXXXXXXXXX',
    'XXXXXXXXXXXXX87777777777778XXXXXXXXXXXXX',
    'XXXXXXXXXXXXX87777777777778XXXXXXXXXXXXX',
    'XXXXXXXXXXXXX87777777777778XXXXXXXXXXXXX',
    'XXXXXXXXXXXXX87777777777778XXXXXXXXXXXXX',
    'XXXXXXXXXXXXX888888D8888888XXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  ],
};
