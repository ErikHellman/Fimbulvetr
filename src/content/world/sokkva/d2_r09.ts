import type { ScreenDef } from '@core/world/screen';

export const d2R09: ScreenDef = {
  id: 'd2_r09',
  region: 'myrland',
  dungeon: 'd2',
  water: 'w_d2_level',
  purpose:
    "The floats: race planks that rise only at the top level lead north out of the great wheel's side room. Two draugr on the landing.",
  things: [
    { k: 'enemy', id: 'draugr', at: { x: 28, y: 9 } },
    { k: 'enemy', id: 'draugr', at: { x: 32, y: 14 } },
  ],
  map: [
    'HHHHHHHHHHHHHHHHHHH44HHHHHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHHHHH44HHHHHHHHHHHHHHHHHHH',
    'HH~~~~~~~~~~~~~~~~~44~~~~~~~~~~~~~~~~~HH',
    'HH~~~~~~~~~~~~~~~~~44~~~~~~~~~~~~~~~~~HH',
    'HH~~~~~~~~~~~~~~~~~44~~~~~~~~~~~~~~~~~HH',
    'HH~~~~~~~~~~~~~~~~~44~~~~~~~~~~~~~~~~~HH',
    'HH~~~~~~~~~~~~~~~~~44~FFFFFFFFFFFFFFFFHH',
    'HH~~~~~~~~~~~~~~~~~44~FFFFFFFFFFFFFFFFHH',
    'HH~~~~~~~~~~~~~~~~~44~FFFFFFFFFFFFFFFFHH',
    'HH~~~~~~~~~~~~~~~~~44~FFFFFFFFFFFFFFFFHH',
    'HH~~~~~~~~~~~~~~~~~FFFFFFFFFFFFFFFFFFFFF',
    'HH~~~~~~~~~~~~~~~~~FFFFFFFFFFFFFFFFFFFFF',
    'HH~~~~~~~~~~~~~~~~~~~~FFFFFFFFFFFFFFFFHH',
    'HH~~~~~~~~~~~~~~~~~~~~FFFFFFFFFFFFFFFFHH',
    'HH~~~~~~~~~~~~~~~~~~~~FFFFFFFFFFFFFFFFHH',
    'HH~~~~~~~~~~~~~~~~~~~~FFFFFFFFFFFFFFFFHH',
    'HH~~~~~~~~~~~~~~~~~~~~FFFFFFFFFFFFFFFFHH',
    'HH~~~~~~~~~~~~~~~~~~~~FFFFFFFFFFFFFFFFHH',
    'HH~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~HH',
    'HH~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~HH',
    'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH',
  ],
};
