import type { ScreenDef } from '@core/world/screen';

export const d2R02: ScreenDef = {
  id: 'd2_r02',
  region: 'myrland',
  dungeon: 'd2',
  water: 'w_d2_level',
  purpose:
    "The mill-race. At level 1 the planks float from the wheel-house to an island (key 2) while two water-worms spit from the race; dry boards run on east to the sump. The powder store's ledge drops in from the north.",
  things: [
    { k: 'chest', id: 'd2_c_key2', at: { x: 20, y: 9 }, gives: { item: 'small_key' } },
    { k: 'enemy', id: 'vatnormr', at: { x: 7, y: 8 } },
    { k: 'enemy', id: 'vatnormr', at: { x: 10, y: 14 } },
  ],
  map: [
    'HHHHHHHHHHHHHHHHHHHFFHHHHHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHHHHHFFHHHHHHHHHHHHHHHHHHH',
    'HH~~~~~~~~~~~~~~~~~FF~~~~~~~~~~~~~~~~~HH',
    'HH~~~~~~~~~~~~~~~~~FF~~~~~~~~~~~~~~~~~HH',
    'HH~~~~~~~~~~~~~~~~~FF~~~~~~~~~~~~~~~~~HH',
    'HH~~~~~~~~~~~~~~~~~FF~~~~~~~~~~~~~~~~~HH',
    'HH~~~~~~~~~~~~FFFFFFFFFFFF~~~~~~~~~~~~HH',
    'HH~~~~~~~~~~~~FFFFFFFFFFFF~~~~~~~~~~~~HH',
    'HH~~~~~~~~~~~~FFFFFFFFFFFF~~~~~~~~~~~~HH',
    'HH~~~~~~~~~~~~FFFFFFFFFFFF~~~~~~~~~~~~HH',
    '33333333333333FFFFFFFFFFFFFFFFFFFFFFFFFF',
    '33333333333333FFFFFFFFFFFFFFFFFFFFFFFFFF',
    'HH~~~~~~~~~~~~FFFFFFFFFFFF~~~~~~~~~~~~HH',
    'HH~~~~~~~~~~~~FFFFFFFFFFFF~~~~~~~~~~~~HH',
    'HH~~~~~~~~~~~~FFFFFFFFFFFF~~~~~~~~~~~~HH',
    'HH~~~~~~~~~~~~FFFFFFFFFFFF~~~~~~~~~~~~HH',
    'HH~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~HH',
    'HH~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~HH',
    'HH~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~HH',
    'HH~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~HH',
    'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
  ],
};
