import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R36: ScreenDef = {
  id: 'd8_r36',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose:
    "Útgarðr's gate hall: Ask comes in from the gate in the ice (19, 20). The hub is north, and a side hall east has the map and a basin.",
  things: [
    { k: 'door', at: { x: 19, y: 20 }, dir: 's', to: 'hrf_utgard', arrive: { x: 19, y: 7 }, facing: 's' },
    { k: 'door', at: { x: 20, y: 20 }, dir: 's', to: 'hrf_utgard', arrive: { x: 20, y: 7 }, facing: 's' },
    {
      k: 'trigger',
      at: { x: 14, y: 12 },
      w: 12,
      h: 6,
      script: 'd8_enter',
      when: { k: 'not', c: { k: 'flag', id: 'st_d8_entered' } },
    },
    {
      k: 'sign',
      at: { x: 10, y: 4 },
      text: {
        en: 'A giant’s boot, carved in the floor, as long as a boat. Under it, in runes a man could read: WE WERE HERE FIRST.',
        sv: 'En jättes stövel, huggen i golvet, lång som en båt. Under den, med runor en människa kan läsa: VI VAR HÄR FÖRST.',
      },
    },
    { k: 'prop', id: 'pot', at: { x: 4, y: 17 } },
    { k: 'prop', id: 'pot', at: { x: 35, y: 17 } },
  ],
  map: room('nse').pillars({ x: 8, y: 6 }, { x: 30, y: 6 }, { x: 8, y: 14 }, { x: 30, y: 14 }).done(),
};
