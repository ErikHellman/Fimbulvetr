import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R29: ScreenDef = {
  id: 'd8_r29',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose:
    "The hub's east half: the east wing (the highlands' tools) through the door east, the wash-hall south.",
  things: [
    {
      k: 'sign',
      at: { x: 33, y: 6 },
      text: {
        en: 'Over the east door, carved small: a chain, a gust, a hammer and a snowflake. The things Ask learned in the high country.',
        sv: 'Över östra dörren, smått ristat: en kedja, en vindil, en hammare och en snöflinga. Det Ask lärde sig i höglandet.',
      },
    },
    { k: 'enemy', id: 'frostvaettr', at: { x: 20, y: 6 } },
    { k: 'prop', id: 'pot', at: { x: 4, y: 3 } },
  ],
  map: room('swe').pillars({ x: 10, y: 15 }, { x: 28, y: 4 }).done(),
};
