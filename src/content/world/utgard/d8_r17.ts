import type { ScreenDef } from '@core/world/screen';
import { flag, not } from '../../dialogue/util';
import { room } from './templates';

export const d8R17: ScreenDef = {
  id: 'd8_r17',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose: 'Past lock A (south): a wall of rime across the door east, that only Eldr melts.',
  things: [
    { k: 'lock', id: 'd8_lock_a', at: { x: 19, y: 21 }, w: 2, h: 1 },
    {
      k: 'gate',
      at: { x: 38, y: 10 },
      w: 2,
      h: 2,
      art: 'rime',
      closed: not(flag('st_d8_melt_r17')),
      melts: 'st_d8_melt_r17',
    },
    {
      k: 'sign',
      at: { x: 20, y: 4 },
      text: {
        en: 'Scratched by a man’s knife on a giant’s wall: COLD KEEPS THEM. FIRE OPENS THEM.',
        sv: 'Ristat med en människas kniv på en jättes vägg: KYLAN HÅLLER DEM. ELDEN ÖPPNAR DEM.',
      },
    },
    { k: 'prop', id: 'pot', at: { x: 4, y: 3 } },
    { k: 'prop', id: 'pot', at: { x: 4, y: 18 } },
  ],
  map: room('se').pillars({ x: 10, y: 8 }, { x: 28, y: 14 }).done(),
};
