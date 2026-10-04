import type { Cond } from '@core/story/cond';
import type { ScreenDef, Thing } from '@core/world/screen';

/** Ketill's axe range by the lower houses (`q_axes`), once he has asked. */
const RANGE: Cond = { k: 'flag', id: 'q_axes_asked' };
const TARGET_FLAGS = ['q_axe_t1', 'q_axe_t2', 'q_axe_t3', 'q_axe_t4', 'q_axe_t5'] as const;

/** Five straw targets in two lanes (one throw from between the lanes would strike both), each with a drop zone over it and the tile before it (a struck axe falls short) that counts the first axe to strike it. */
const TARGETS: Thing[] = (
  [
    [17, 18],
    [17, 20],
    [20, 18],
    [20, 20],
    [23, 20],
  ] as const
).flatMap(([x, y], i): Thing[] => {
  const flag = TARGET_FLAGS[i] ?? 'q_axe_t1';
  return [
    { k: 'enemy', id: 'dummy', at: { x, y }, when: RANGE },
    {
      k: 'drop',
      at: { x: x - 1, y },
      w: 2,
      h: 1,
      accepts: 'axe',
      when: { k: 'not', c: { k: 'flag', id: flag } },
      do: [
        { k: 'set', flag, value: true },
        { k: 'add', flag: 'q_axes_hit', n: 1 },
      ],
    },
  ];
});

/** Six throwing axes in a row by the rack; a miss lies where it lands, to be thrown again. */
const AXES: Thing[] = (
  [
    [6, 18],
    [7, 18],
    [8, 18],
    [10, 18],
    [11, 18],
    [12, 18],
  ] as const
).map(([x, y]): Thing => ({ k: 'prop', id: 'axe', at: { x, y }, when: RANGE }));

export const uppSmiths: ScreenDef = {
  id: 'upp_smiths',
  region: 'myrkvidr',
  purpose:
    "Ketill's smithy (door; his anvil outside is his shop by day), Sölvi's rune-carver's hall (door), and the bay with a jetty. After the snap, Ketill's axe range by the lower houses: a rack of throwing axes and five straw targets (q_axes).",
  things: [
    ...TARGETS,
    ...AXES,
    {
      k: 'trigger',
      at: { x: 0, y: 0 },
      w: 40,
      h: 22,
      script: 'axes_start',
      when: { k: 'flag', id: 'ev_axes_on' },
    },
    /** Ketill's anvil: his shop by day, unless rain drives him indoors. */
    {
      k: 'use',
      at: { x: 15, y: 7 },
      script: 'shop_ketill',
      when: {
        k: 'all',
        of: [
          { k: 'phase', is: ['morning', 'day'] },
          { k: 'not', c: { k: 'weather', is: ['rain', 'storm'] } },
        ],
      },
    },
    { k: 'door', at: { x: 9, y: 6 }, dir: 'n', to: 'upp_int_smithy', arrive: { x: 19, y: 15 }, facing: 'n' },
    {
      k: 'door',
      at: { x: 9, y: 17 },
      dir: 'n',
      to: 'upp_int_runehall',
      arrive: { x: 19, y: 15 },
      facing: 'n',
    },
  ],
  map: [
    'IIIIIIIIIIIIIIIIIIIIIIIInn~~~~~~~~~~~~~#',
    'I.......................nn~~~~~~~~~~~~~#',
    'I...RRRRRRRRRR..........nn~~~~~~~~~~~~~#',
    'I...RRRCRRRRRR....T.....nn~~~~~~~~~~~~~#',
    'I...RRRRRRRRRR..........nn~~~~~~~~~~~~~#',
    'I...RRRRRRRRRR..........nn~~~~~~~~~~~~~#',
    'I...W+WWWDWW+W.......T..nn~~~~~~~~~~~~~#',
    'I........p.....a........nn~~~~~~~~~~~~~#',
    'I........p..............nn~~~~~~~~~~~~~#',
    'pppppppppppppppppppppppppp~~~~~~~~~~~~~#',
    'pppppppppppppppppppppppppp~~~~~~~~~~~~~#',
    'ppppppppppppppppppppppppppJJJJJJ~~~~~~~#',
    'pppppppppppppppppppppppppp~~~~~~~~~~~~~#',
    'I...RRRRRRRRRRR.........nn~~~~~~~~~~~~~#',
    'I...RRRRRRRRRRR.........nn~~~~~~~~~~~~~#',
    'I...RRRRRRRRRRR.........nn~~~~~~~~~~~~~#',
    'I...RRRRRRRRRRR.........nn~~~~~~~~~~~~~#',
    'I...WW+WWDWW+WW....T....nn~~~~~~~~~~~~~#',
    'I........p..............nn~~~~~~~~~~~~~#',
    'I.....................T.nn~~~~~~~~~~~~~#',
    'I.......................nn~~~~~~~~~~~~~#',
    'IIIIIIIIIIIIIIIIIIIIIIIInn~~~~~~~~~~~~~#',
  ],
};
