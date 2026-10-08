import type { ScreenDef } from '@core/world/screen';
import { eveningDue, raidNight } from '../../dialogue/util';

export const askIntLonghouse: ScreenDef = {
  id: 'ask_int_longhouse',
  region: 'askdalr',
  purpose: "Halvar's longhouse, where Ask sleeps. The prologue starts and ends each day at Ask's bed.",
  indoor: true,
  things: [
    { k: 'use', at: { x: 10, y: 6 }, h: 2, script: 'sleep' },
    /** Halvar's table: the spring feast (M11a) once the mead, the fish and the ale are all brought. */
    {
      k: 'use',
      at: { x: 26, y: 15 },
      w: 2,
      script: 'end_feast',
      when: {
        k: 'all',
        of: [
          { k: 'flag', id: 'q_feast_mead' },
          { k: 'flag', id: 'q_feast_fish' },
          { k: 'flag', id: 'q_feast_cask' },
          { k: 'not', c: { k: 'flag', id: 'q_feast_done' } },
        ],
      },
    },
    {
      k: 'trigger',
      at: { x: 16, y: 16 },
      w: 8,
      h: 4,
      script: 'embla_evening',
      when: { k: 'any', of: [eveningDue(1), eveningDue(2), eveningDue(3)] },
    },
    { k: 'door', at: { x: 19, y: 20 }, dir: 's', to: 'ask_farmyard', arrive: { x: 9, y: 8 }, facing: 's' },
    // The raid night: the roof burns down in patches, and one of the dead is already inside.
    { k: 'fire', at: { x: 8, y: 11 }, w: 9, h: 1, when: raidNight },
    { k: 'fire', at: { x: 20, y: 15 }, w: 6, h: 1, when: raidNight },
    { k: 'fire', at: { x: 28, y: 15 }, w: 4, h: 1, when: raidNight },
    { k: 'fire', at: { x: 14, y: 18 }, w: 3, h: 1, when: raidNight },
    { k: 'enemy', id: 'draugr', at: { x: 29, y: 9 }, when: raidNight },
  ],
  map: [
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    'XXXXXXXwwwwwwwwwwwwwwwwwwwwwwwwwwXXXXXXX',
    'XXXXXXXwffffffffffffffffffffffffwXXXXXXX',
    'XXXXXXXwffbffffffffffffffffbfbffwXXXXXXX',
    'XXXXXXXwffbffffffffffffffffbfbffwXXXXXXX',
    'XXXXXXXwffffffffffffffffffffffffwXXXXXXX',
    'XXXXXXXwffffffffffffffffffffffffwXXXXXXX',
    'XXXXXXXwffffffffffffffffffffffffwXXXXXXX',
    'XXXXXXXwffffffffffhhffffffffffffwXXXXXXX',
    'XXXXXXXwffffffffffhhffffffffffffwXXXXXXX',
    'XXXXXXXwffffffffffffffffffffffffwXXXXXXX',
    'XXXXXXXwffffffffffffffffffffffffwXXXXXXX',
    'XXXXXXXwffffffffffffffffffttffffwXXXXXXX',
    'XXXXXXXwffttffffffffffffffffffffwXXXXXXX',
    'XXXXXXXwffffffffffffffffffffffffwXXXXXXX',
    'XXXXXXXwffffffffffffffffffffffffwXXXXXXX',
    'XXXXXXXwffffffffffffffffffffffffwXXXXXXX',
    'XXXXXXXwwwwwwwwwwwwDwwwwwwwwwwwwwXXXXXXX',
    'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
  ],
};
