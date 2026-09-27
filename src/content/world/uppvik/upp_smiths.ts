import type { ScreenDef } from '@core/world/screen';

export const uppSmiths: ScreenDef = {
  id: 'upp_smiths',
  region: 'myrkvidr',
  purpose:
    "Ketill's smithy (door; his anvil outside is his shop by day), Sölvi's rune-carver's hall (door), and the bay with a jetty.",
  things: [
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
    'IIIIIIIIIIIIIIIIIIIIIIIInn~~~~~~~~~~~~~~',
    'I.......................nn~~~~~~~~~~~~~~',
    'I...RRRRRRRRRR..........nn~~~~~~~~~~~~~~',
    'I...RRRCRRRRRR....T.....nn~~~~~~~~~~~~~~',
    'I...RRRRRRRRRR..........nn~~~~~~~~~~~~~~',
    'I...RRRRRRRRRR..........nn~~~~~~~~~~~~~~',
    'I...W+WWWDWW+W.......T..nn~~~~~~~~~~~~~~',
    'I........p.....a........nn~~~~~~~~~~~~~~',
    'I........p..............nn~~~~~~~~~~~~~~',
    'pppppppppppppppppppppppppp~~~~~~~~~~~~~~',
    'pppppppppppppppppppppppppp~~~~~~~~~~~~~~',
    'ppppppppppppppppppppppppppJJJJJJ~~~~~~~~',
    'pppppppppppppppppppppppppp~~~~~~~~~~~~~~',
    'I...RRRRRRRRRRR.........nn~~~~~~~~~~~~~~',
    'I...RRRRRRRRRRR.........nn~~~~~~~~~~~~~~',
    'I...RRRRRRRRRRR.........nn~~~~~~~~~~~~~~',
    'I...RRRRRRRRRRR.........nn~~~~~~~~~~~~~~',
    'I...WW+WWDWW+WW....T....nn~~~~~~~~~~~~~~',
    'I........p..............nn~~~~~~~~~~~~~~',
    'I.....................T.nn~~~~~~~~~~~~~~',
    'I.......................nn~~~~~~~~~~~~~~',
    'IIIIIIIIIIIIIIIIIIIIIIIInn~~~~~~~~~~~~~~',
  ],
};
