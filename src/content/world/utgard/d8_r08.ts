import type { ScreenDef } from '@core/world/screen';
import { room } from './templates';

export const d8R08: ScreenDef = {
  id: 'd8_r08',
  region: 'hrimfjoll',
  dungeon: 'd8',
  purpose:
    'The high wing begins: the floor is glaze from wall to wall (rows 4–17). From the south ledge a slide north along column 4 stops at the pillar (4, 8), and from there west to the door.',
  things: [
    {
      k: 'sign',
      at: { x: 30, y: 19 },
      text: {
        en: 'THE HIGH WING. WHAT IS LEARNED LAST IS TESTED LAST.',
        sv: 'DEN HÖGA FLYGELN. DET SOM LÄRS SIST PRÖVAS SIST.',
      },
    },
  ],
  map: room('sw').rink(2, 4, 36, 14).pillars({ x: 4, y: 8 }).done(),
};
