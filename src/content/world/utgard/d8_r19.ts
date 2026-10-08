import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R19: ScreenDef = {
  id: 'd8_r19',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose: "A giant's strongroom: a cell with a cracked wall (28, 9). A bomb opens it on a cache of silver.",
  things: [
    { k: 'crack', id: 'd8_k_r19', at: { x: 28, y: 9 }, w: 1, h: 2, art: 'wall' },
    {
      k: 'chest',
      id: 'd8_c_cache',
      at: { x: 32, y: 10 },
      gives: {
        silver: 100,
        text: {
          en: 'You found a hundred pieces of silver: a giant’s small change.',
          sv: 'Du hittade hundra silverbitar: en jättes växelpengar.',
        },
      },
    },
    { k: 'enemy', id: 'isvargr', at: { x: 14, y: 14 } },
    { k: 'prop', id: 'pot', at: { x: 4, y: 3 } },
  ],
  map: room('w').cell(28, 6, 8, 8, 'w').done(),
};
