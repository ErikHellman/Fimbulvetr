import type { ScreenDef } from '@core/world/screen';
import { all, flag, not } from '../../dialogue/util';

export const nifCauseway: ScreenDef = {
  id: 'nif_causeway',
  region: 'niflmyrr',
  purpose:
    "A sunken plank causeway between Niflmýrr's black pools, the only dry way west from the gorge. The planks wind, and the fog hides where they go next; by night the mara ride here.",
  things: [
    /** A wisp ember for Heiðr (`q_ljos`), drifting here at night until it is caught. */
    {
      k: 'prop',
      id: 'wisp_ember',
      at: { x: 15, y: 13 },
      when: all({ k: 'phase', is: 'night' }, flag('q_ljos_asked'), not(flag('w_ember_causeway'))),
      onBreak: [{ k: 'set', flag: 'w_ember_causeway', value: true }],
    },
  ],
  /** Where Niflmýrr's spawn table may put foes (see content/spawns.ts). */
  spawns: [
    { x: 16, y: 17 },
    { x: 25, y: 17 },
    { x: 29, y: 15 },
  ],
  map: [
    '########################################',
    '########################################',
    '####**6****5555555555555555555****6*####',
    '###****55555555555555555555555555***####',
    '##***555555555555555555555555555555**###',
    '***5555555555555****5555555555555555**##',
    'pppppppppp555555**6**555555555555555***#',
    'pppppppppp555555*****555555555555555***#',
    '**5555555p555555**K**55555555555555****#',
    '#*5555555p55555555p5555555pppppppppp****',
    '#5555555pppppppppppppppppppp55555555****',
    '#555555555555555555p55555555555555555***',
    '#*55555555555555555p555555555555555555**',
    '##555555555555***55p5555555555555555***#',
    '##5555555555*****6*p5555*****55555555**#',
    '###55555555*******pp555***6****55555***#',
    '###*555555**6*******5555*******5555****#',
    '####**5555***********55*****K***55****##',
    '#####****************************#######',
    '########***6*******######****6##########',
    '########################################',
    '########################################',
  ],
};
