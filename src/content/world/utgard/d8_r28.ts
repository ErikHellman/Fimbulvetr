import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R28: ScreenDef = {
  id: 'd8_r28',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose:
    "The hub's west half: the west wing (the lowlands' tools) through the door west, the seal hall north, the gate hall south.",
  things: [
    {
      k: 'sign',
      at: { x: 6, y: 6 },
      text: {
        en: 'Over the west door, carved small: a boomerang, a bomb, a bow and a flame. The things a farmhand learned in the lowlands.',
        sv: 'Över västra dörren, smått ristat: en bumerang, en bomb, en båge och en låga. Det en dräng lärde sig i låglandet.',
      },
    },
    { k: 'enemy', id: 'draugr', at: { x: 12, y: 14 } },
    { k: 'enemy', id: 'draugr', at: { x: 28, y: 6 } },
    { k: 'prop', id: 'pot', at: { x: 35, y: 3 } },
  ],
  map: room('nsew').pillars({ x: 10, y: 4 }, { x: 28, y: 15 }).done(),
};
