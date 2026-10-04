import type { ScreenDef, Thing } from '@core/world/screen';

export const myrTrollskog: ScreenDef = {
  id: 'myr_trollskog',
  region: 'myrkvidr',
  purpose:
    'The troll wood east of the roots: deep moss, old pines and boulders. A ring of troll stones guards a heart piece; one stone blocks the gap and can be lifted away.',
  things: [
    /** The stone in the ring's gap: a troll the sun caught. Lift it and throw it. */
    { k: 'prop', id: 'troll_stone', at: { x: 28, y: 12 } },
    { k: 'piece', id: 'hp_myr_trollskog', at: { x: 28, y: 8 } },
    /**
     * Two old trolls walk the wood every night; the sunrise turns them to stone where they stand, and each
     * counts for Önundr's hunt (`q_trolls`).
     */
    ...[
      [12, 9],
      [20, 15],
    ].map(([x = 0, y = 0]): Thing => ({
      k: 'enemy',
      id: 'forest_troll',
      at: { x, y },
      when: { k: 'phase', is: 'night' },
      onStone: [{ k: 'add', flag: 'q_trolls_stoned', n: 1 }],
    })),
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
