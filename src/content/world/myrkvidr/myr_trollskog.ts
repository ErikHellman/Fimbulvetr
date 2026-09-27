import type { ScreenDef } from '@core/world/screen';

export const myrTrollskog: ScreenDef = {
  id: 'myr_trollskog',
  region: 'myrkvidr',
  purpose:
    'The troll wood east of the roots: deep moss, old pines and boulders. A ring of troll stones guards a heart piece; one stone blocks the gap and can be lifted away.',
  things: [
    /** The stone in the ring's gap: a troll the sun caught. Lift it and throw it. */
    { k: 'prop', id: 'troll_stone', at: { x: 28, y: 12 } },
    { k: 'piece', id: 'hp_myr_trollskog', at: { x: 28, y: 8 } },
  ],
  /** Where the Myrkviðr spawn table may put foes (rolled by day and night, see content/spawns.ts). */
  spawns: [
    { x: 10, y: 7 },
    { x: 20, y: 10 },
    { x: 33, y: 16 },
    { x: 15, y: 17 },
  ],
  map: [
    'TPTPTPPPPPPTPTPTPPPPPPPPPPPTPPPTTPPPPPPP',
    'TTPPPPTPPPPPPPTPPPTPPPTPTTPPPPTPTTPPTPPT',
    'TPPPPTPTPTPPTTTPTTPTTTTTTTTPPPPTPTPPPTPT',
    'PPTuPuuPuuPPuuuuuuPuPuPuuuuuuuuuPuPPuTTP',
    'PPPuuuuuuPuuuuuuuuKuuuuuuuuKKKuuuuuuuPTT',
    'PPPPuuuuuuuKuuuuuuuu%uuuuuKuuuKuuuuuuPPP',
    'PPPuuuuu%%uuuuuuuuuuuuPuuKuuuuuKuuuuuTTP',
    'TPTPuuuuuuuuuuuuuuuuuuuuuKuuuuuKuuKuuPPP',
    'PPPuuuKuuuuPuuuuuuuPPuKuuKuuuuuKuKuuPTPP',
    'PPPPuuuuuKuuuuuuuuuuuuuPuKuuuuuKuuPuuPPP',
    'PPPuuuuuuuuuuuuuuuuuuuuuuKuuuuuKuuuuuPPP',
    'PPPPuuuuuuuuuuuuuPuuuuuuuuKuuuKuuuuuuPPP',
    'uuuPuuuuuuuuuuuuuPKuuuuuuuuKuKuuuuuuuTPT',
    'uuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuPuuPPT',
    'uuuuuuuuuuuuuuuuuuuuuuuuuuuuuKuPuuuuuPPT',
    'PTTuuuuuuuuPuuuuuuuuuuuuKuuPuuuKu%PuuPPP',
    'PTPuuuuuuuuuPu%%uuuuPuuuuuPuuuuuuuuuPTTP',
    'PPTuuKuuuKuuuuuuuuuuuuuuuPuuuuuuuuuPuTPP',
    'TPPuPuuuuuuuuuuPuuPuuuPuuuuuPuPuuuPPuPPP',
    'PPPPPPPTPPPPTTTPPTPTPTPPPTTTPPPTTPPPTPTP',
    'PTTPPTTPPPTPTPPTTPTPPPPTTPPPPPPTPPPPPPPP',
    'PPPPPPPPTTPTTPPPTPPTPTPPPPTTTPPPPPPTTPPP',
  ],
};
