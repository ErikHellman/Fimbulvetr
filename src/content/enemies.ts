import type { AttackWindow, EnemyDef } from '@core/actors/enemies/defs';
import type { Box } from '@core/math/box';
import { ARROW, HEAVY, PIERCE_SHIELD } from '@core/combat/hit';
import type { EnemyId } from './ids';

/** The same box for every facing (a body slam). */
const around = (b: Box): AttackWindow['boxes'] => ({ n: b, s: b, e: b, w: b });

export const ENEMY_DEFS = {
  dummy: {
    id: 'dummy',
    art: 'prop_dummy',
    hp: 40,
    /** 10 px tall so the hero's 6 px corner-slide cannot slip around it. */
    body: { x: -7, y: -10, w: 14, h: 10 },
    hurt: { x: -8, y: -26, w: 16, h: 26 },
    behaviour: 'dummy',
    knockResist: 1,
    immortal: true,
    solid: true,
  },
  /** A wolf: stalks, crouches (400 ms), lunges along a locked line, then stands winded. */
  vargr: {
    id: 'vargr',
    art: 'enemy_vargr',
    hp: 6,
    body: { x: -7, y: -8, w: 14, h: 8 },
    hurt: { x: -10, y: -16, w: 20, h: 16 },
    behaviour: 'vargr',
    knockResist: 0,
    immortal: false,
    solid: false,
    touch: { amount: 1, knock: 2, tags: 0 },
    attacks: {
      lunge: {
        from: 0,
        to: 13,
        boxes: around({ x: -9, y: -14, w: 18, h: 14 }),
        amount: 2,
        knock: 4,
        tags: 0,
      },
    },
    stunnable: 150,
    drops: { heart: 2, silver: 3, none: 5 },
  },
  /** The walking dead: slow, raises both arms (500 ms), and the blow staggers through a shield. */
  draugr: {
    id: 'draugr',
    art: 'enemy_draugr',
    hp: 8,
    body: { x: -6, y: -8, w: 12, h: 8 },
    hurt: { x: -7, y: -26, w: 14, h: 26 },
    behaviour: 'draugr',
    /** The dead burn: fire bites them twice as deep. */
    weak: ['fire'],
    knockResist: 0.5,
    immortal: false,
    solid: false,
    touch: { amount: 1, knock: 2, tags: 0 },
    attacks: {
      swing: {
        from: 0,
        to: 6,
        boxes: {
          e: { x: 0, y: -26, w: 22, h: 26 },
          w: { x: -22, y: -26, w: 22, h: 26 },
          s: { x: -12, y: -12, w: 24, h: 22 },
          n: { x: -12, y: -36, w: 24, h: 24 },
        },
        amount: 4,
        knock: 5,
        tags: HEAVY,
      },
    },
    stunnable: 120,
    drops: { heart: 3, silver: 3, none: 4 },
  },
  /** A raid troll: cannot be hurt; its club comes down after a 500 ms wind-up. */
  troll: {
    id: 'troll',
    art: 'enemy_troll',
    hp: 99,
    body: { x: -11, y: -12, w: 22, h: 12 },
    hurt: { x: -14, y: -44, w: 28, h: 44 },
    behaviour: 'troll',
    knockResist: 1,
    immortal: true,
    guard: true,
    solid: true,
    touch: { amount: 2, knock: 5, tags: HEAVY },
    attacks: {
      smash: {
        from: 4,
        to: 9,
        boxes: around({ x: -30, y: -30, w: 60, h: 40 }),
        amount: 6,
        knock: 7,
        tags: HEAVY,
      },
    },
  },
  /** A root with a mouth: buried until Ask comes near, it rears up (400 ms) and snaps. */
  root_biter: {
    id: 'root_biter',
    art: 'enemy_root_biter',
    hp: 4,
    body: { x: -6, y: -8, w: 12, h: 8 },
    hurt: { x: -7, y: -20, w: 14, h: 20 },
    behaviour: 'root_biter',
    knockResist: 1,
    immortal: false,
    solid: false,
    attacks: {
      bite: {
        from: 0,
        to: 5,
        boxes: {
          n: { x: -9, y: -34, w: 18, h: 24 },
          s: { x: -9, y: -10, w: 18, h: 24 },
          e: { x: -2, y: -20, w: 24, h: 20 },
          w: { x: -22, y: -20, w: 24, h: 20 },
        },
        amount: 2,
        knock: 4,
        tags: 0,
      },
    },
    stunnable: 150,
    drops: { heart: 3, silver: 2, none: 5 },
  },
  /** The root-wight of the first stone: its core opens only while all three bulbs are stunned. */
  rotvaettr: {
    id: 'rotvaettr',
    art: 'enemy_rotvaettr',
    hp: 24,
    body: { x: -14, y: -10, w: 28, h: 10 },
    hurt: { x: -16, y: -30, w: 32, h: 30 },
    behaviour: 'rotvaettr',
    knockResist: 1,
    immortal: false,
    solid: true,
    touch: { amount: 2, knock: 5, tags: 0 },
    boss: { name: { en: 'Rótvættr', sv: 'Rótvættr' } },
    needs: ['boomerang'],
  },
  /** One of Rótvættr's bulbs: it cannot die, only be stunned shut. */
  rot_bulb: {
    id: 'rot_bulb',
    art: 'enemy_rot_bulb',
    hp: 1,
    body: { x: -7, y: -8, w: 14, h: 8 },
    hurt: { x: -8, y: -18, w: 16, h: 18 },
    behaviour: 'rot_bulb',
    knockResist: 1,
    immortal: true,
    solid: true,
    stunnable: 450,
  },
  /** A spike of root bursting up under Ask after the ground cracks (400 ms); a shield is no help. */
  root_spike: {
    id: 'root_spike',
    art: 'enemy_root_spike',
    hp: 1,
    body: { x: -6, y: -8, w: 12, h: 8 },
    hurt: { x: -6, y: -8, w: 12, h: 8 },
    behaviour: 'root_spike',
    knockResist: 1,
    immortal: true,
    solid: false,
    attacks: {
      erupt: {
        from: 0,
        to: 8,
        boxes: around({ x: -8, y: -16, w: 16, h: 16 }),
        amount: 2,
        knock: 4,
        tags: PIERCE_SHIELD,
      },
    },
  },
  /**
   * A forest troll: it roams Myrkviðr only at night and cannot be hurt; the sunrise turns it to stone.
   */
  forest_troll: {
    id: 'forest_troll',
    art: 'enemy_forest_troll',
    hp: 99,
    body: { x: -11, y: -12, w: 22, h: 12 },
    hurt: { x: -14, y: -44, w: 28, h: 44 },
    behaviour: 'troll',
    knockResist: 1,
    immortal: true,
    guard: true,
    solid: true,
    petrify: 'troll_stone',
    touch: { amount: 2, knock: 5, tags: HEAVY },
    attacks: {
      smash: {
        from: 4,
        to: 9,
        boxes: around({ x: -30, y: -30, w: 60, h: 40 }),
        amount: 6,
        knock: 7,
        tags: HEAVY,
      },
    },
  },
  /**
   * The pack leader on the north road (the vargar hunt): bigger, darker, a white ruff. It howls (400 ms)
   * and vargr come until two of its own live; its lunge staggers through a shield.
   */
  vargr_alpha: {
    id: 'vargr_alpha',
    art: 'enemy_vargr_alpha',
    hp: 14,
    body: { x: -9, y: -9, w: 18, h: 9 },
    hurt: { x: -12, y: -20, w: 24, h: 20 },
    behaviour: 'vargr_alpha',
    knockResist: 0.5,
    immortal: false,
    solid: false,
    touch: { amount: 2, knock: 3, tags: 0 },
    attacks: {
      lunge: {
        from: 0,
        to: 15,
        boxes: around({ x: -11, y: -16, w: 22, h: 16 }),
        amount: 4,
        knock: 6,
        tags: HEAVY,
      },
    },
    stunnable: 90,
    drops: { heart: 3, silver: 3, seidr: 1, none: 1 },
  },
  /**
   * The Rime King's raven, abroad at night: it circles out of reach, shrieks (400 ms) when it spots Ask —
   * a vargr answers — and dives. Strike it as it climbs back.
   */
  rime_raven: {
    id: 'rime_raven',
    art: 'enemy_rime_raven',
    hp: 4,
    body: { x: -5, y: -6, w: 10, h: 6 },
    hurt: { x: -9, y: -18, w: 18, h: 14 },
    behaviour: 'rime_raven',
    knockResist: 0,
    immortal: false,
    solid: false,
    flies: true,
    weak: ['fire'],
    attacks: {
      dive: {
        from: 0,
        to: 25,
        boxes: around({ x: -8, y: -16, w: 16, h: 14 }),
        amount: 2,
        knock: 3,
        tags: 0,
      },
    },
    stunnable: 120,
    drops: { heart: 1, silver: 2, seidr: 2, none: 3 },
  },
  /**
   * A water-worm in a pool: out of reach under the water, it rears up (400 ms), spits a gob of mud the
   * shield stops, and stays up a while, open to a blow from the bank; the boomerang holds it up.
   */
  vatnormr: {
    id: 'vatnormr',
    art: 'enemy_vatnormr',
    hp: 3,
    body: { x: -6, y: -6, w: 12, h: 6 },
    hurt: { x: -8, y: -20, w: 16, h: 20 },
    behaviour: 'vatnormr',
    knockResist: 1,
    immortal: false,
    solid: false,
    swims: true,
    stunnable: 120,
    drops: { heart: 2, silver: 3, none: 3 },
  },
  /**
   * A bog-light: a cold flame over the fen at night. It drifts, fades out of reach now and then, flares
   * (400 ms) and darts. It lights the dark around it.
   */
  myrljos: {
    id: 'myrljos',
    art: 'enemy_myrljos',
    hp: 2,
    body: { x: -4, y: -4, w: 8, h: 4 },
    hurt: { x: -7, y: -20, w: 14, h: 14 },
    behaviour: 'myrljos',
    knockResist: 0,
    immortal: false,
    solid: false,
    flies: true,
    glow: 48,
    attacks: {
      dart: {
        from: 0,
        to: 19,
        boxes: around({ x: -7, y: -18, w: 14, h: 14 }),
        amount: 2,
        knock: 3,
        tags: 0,
      },
    },
    stunnable: 90,
    drops: { heart: 1, silver: 1, seidr: 3, none: 3 },
  },
  /**
   * A mud-crab: its shell turns every blow until a bomb's blast cracks it; then the sword finishes it. It
   * sidles in to Ask's flank and raises its claws (400 ms) before it pinches.
   */
  leirkrabbi: {
    id: 'leirkrabbi',
    art: 'enemy_leirkrabbi',
    hp: 12,
    body: { x: -8, y: -7, w: 16, h: 7 },
    hurt: { x: -10, y: -16, w: 20, h: 16 },
    behaviour: 'leirkrabbi',
    knockResist: 0.6,
    immortal: false,
    solid: false,
    guard: true,
    cracks: 'force',
    needs: ['bombs'],
    attacks: {
      pinch: {
        from: 0,
        to: 6,
        boxes: {
          e: { x: 0, y: -16, w: 20, h: 16 },
          w: { x: -20, y: -16, w: 20, h: 16 },
          s: { x: -12, y: -8, w: 24, h: 18 },
          n: { x: -12, y: -26, w: 24, h: 18 },
        },
        amount: 3,
        knock: 4,
        tags: 0,
      },
    },
    drops: { heart: 2, silver: 2, bombs: 4, none: 2 },
  },
  /**
   * Lindormr, the serpent that sank the mill: it hides in its mud mounds, rears (400 ms) and spits. Only a
   * bomb on the mound it hides in flushes it out, stunned and open to the blade (see lindormr.ts).
   */
  lindormr: {
    id: 'lindormr',
    art: 'enemy_lindormr',
    hp: 24,
    body: { x: -12, y: -8, w: 24, h: 8 },
    hurt: { x: -14, y: -34, w: 28, h: 34 },
    behaviour: 'lindormr',
    knockResist: 1,
    immortal: false,
    solid: false,
    attacks: {
      charge: {
        from: 0,
        to: 149,
        boxes: around({ x: -14, y: -26, w: 28, h: 26 }),
        amount: 4,
        knock: 6,
        tags: HEAVY,
      },
    },
    boss: { name: { en: 'Lindormr', sv: 'Lindormr' } },
    needs: ['bombs'],
  },
  /** One of Lindormr's mud mounds: the blade only sinks in; a blast blows it apart, and bombs spill out. */
  lind_mound: {
    id: 'lind_mound',
    art: 'enemy_lind_mound',
    hp: 1,
    body: { x: -10, y: -10, w: 20, h: 10 },
    hurt: { x: -11, y: -16, w: 22, h: 16 },
    behaviour: 'lind_mound',
    knockResist: 1,
    immortal: false,
    solid: true,
    guard: true,
    cracks: 'force',
    drops: { heart: 0, silver: 0, bombs: 1, none: 0 },
  },
  /**
   * A barrow-wight of Haugar: a draugr in mail behind a round shield. Blows from the front clink off; it
   * raises its blade (400 ms) and cuts, and its guard is down until it recovers. Flank it, wait out the cut,
   * or pierce the shield with a dash thrust.
   */
  haugbui: {
    id: 'haugbui',
    art: 'enemy_haugbui',
    hp: 8,
    body: { x: -6, y: -8, w: 12, h: 8 },
    hurt: { x: -8, y: -28, w: 16, h: 28 },
    behaviour: 'haugbui',
    weak: ['fire'],
    knockResist: 0.4,
    immortal: false,
    solid: false,
    shield: true,
    attacks: {
      cut: {
        from: 0,
        to: 6,
        boxes: {
          e: { x: 0, y: -26, w: 22, h: 24 },
          w: { x: -22, y: -26, w: 22, h: 24 },
          s: { x: -12, y: -12, w: 24, h: 22 },
          n: { x: -12, y: -36, w: 24, h: 24 },
        },
        amount: 3,
        knock: 4,
        tags: 0,
      },
    },
    stunnable: 90,
    drops: { heart: 2, silver: 4, none: 3 },
  },
  /**
   * A draugr archer of Konungshaugr: keeps its distance, draws (400 ms) and looses an arrow the shield
   * stops. Weak to fire; leaves arrows once the bow is owned.
   */
  bogdraugr: {
    id: 'bogdraugr',
    art: 'enemy_bogdraugr',
    hp: 4,
    body: { x: -6, y: -8, w: 12, h: 8 },
    hurt: { x: -7, y: -26, w: 14, h: 26 },
    behaviour: 'bogdraugr',
    weak: ['fire'],
    knockResist: 0.3,
    immortal: false,
    solid: false,
    stunnable: 120,
    drops: { heart: 2, silver: 2, arrows: 4, none: 2 },
  },
  /**
   * Haugvörðr, the barrow-warden, Konungshaugr's mini-boss: a giant shielded wight (see warden.ts). Its
   * sweep (400 ms tell) and its shield bash (500 ms tell) both stagger through a raised shield; a bash into
   * a wall leaves it dazed and open.
   */
  haugvordr: {
    id: 'haugvordr',
    art: 'enemy_haugvordr',
    hp: 16,
    body: { x: -10, y: -10, w: 20, h: 10 },
    hurt: { x: -12, y: -40, w: 24, h: 40 },
    behaviour: 'haugvordr',
    knockResist: 0.9,
    immortal: false,
    solid: true,
    shield: true,
    weak: ['fire'],
    boss: { name: { en: 'Haugvörðr, the barrow-warden', sv: 'Haugvörðr, högväktaren' }, mini: true },
    attacks: {
      sweep: {
        from: 0,
        to: 6,
        boxes: {
          e: { x: 0, y: -36, w: 30, h: 36 },
          w: { x: -30, y: -36, w: 30, h: 36 },
          s: { x: -18, y: -14, w: 36, h: 30 },
          n: { x: -18, y: -46, w: 36, h: 30 },
        },
        amount: 4,
        knock: 6,
        tags: HEAVY,
      },
      bash: {
        from: 0,
        to: 119,
        boxes: {
          e: { x: 4, y: -34, w: 16, h: 34 },
          w: { x: -20, y: -34, w: 16, h: 34 },
          s: { x: -14, y: -8, w: 28, h: 18 },
          n: { x: -14, y: -44, w: 28, h: 18 },
        },
        amount: 4,
        knock: 8,
        tags: HEAVY,
      },
    },
    drops: { heart: 1, silver: 0, none: 0 },
  },
  /**
   * The Haugbúi King, Konungshaugr's boss (see king.ts): his mail turns every blow; an arrow in his
   * blazing crown while he lowers his head to charge (500 ms tell) fells him, open to the blade.
   */
  haugkonungr: {
    id: 'haugkonungr',
    art: 'enemy_haugkonungr',
    hp: 24,
    body: { x: -12, y: -10, w: 24, h: 10 },
    hurt: { x: -14, y: -44, w: 28, h: 44 },
    behaviour: 'haugkonungr',
    knockResist: 1,
    immortal: false,
    solid: true,
    struckBy: ARROW,
    needs: ['bow'],
    boss: { name: { en: 'The Haugbúi King', sv: 'Högbokungen' } },
    attacks: {
      sweep: {
        from: 0,
        to: 6,
        boxes: {
          e: { x: 0, y: -40, w: 32, h: 40 },
          w: { x: -32, y: -40, w: 32, h: 40 },
          s: { x: -20, y: -14, w: 40, h: 32 },
          n: { x: -20, y: -50, w: 40, h: 32 },
        },
        amount: 4,
        knock: 6,
        tags: HEAVY,
      },
      charge: {
        from: 0,
        to: 149,
        boxes: {
          e: { x: 4, y: -40, w: 18, h: 40 },
          w: { x: -22, y: -40, w: 18, h: 40 },
          s: { x: -14, y: -10, w: 28, h: 22 },
          n: { x: -14, y: -52, w: 28, h: 22 },
        },
        amount: 4,
        knock: 8,
        tags: HEAVY,
      },
    },
  },
  /**
   * Styrr in his last duel (see huscarl.ts): shield up and a cut, then, worn down, a heavy overhead
   * that staggers through the shield, his own guard down while it falls. Nobody dies: he yields at 0,
   * and Ask's fall to one heart ends the duel instead (`duel`).
   */
  styrr_duel: {
    id: 'styrr_duel',
    art: 'enemy_styrr',
    hp: 12,
    body: { x: -6, y: -8, w: 12, h: 8 },
    hurt: { x: -8, y: -28, w: 16, h: 28 },
    behaviour: 'huscarl',
    knockResist: 0.6,
    immortal: false,
    solid: true,
    shield: true,
    boss: { name: { en: 'Styrr', sv: 'Styrr' }, mini: true },
    duel: { flag: 'ev_duel_on', lost: 'duel_lost' },
    parryStun: 60,
    attacks: {
      cut: {
        from: 0,
        to: 6,
        boxes: {
          e: { x: 0, y: -26, w: 22, h: 24 },
          w: { x: -22, y: -26, w: 22, h: 24 },
          s: { x: -12, y: -12, w: 24, h: 22 },
          n: { x: -12, y: -36, w: 24, h: 24 },
        },
        amount: 3,
        knock: 4,
        tags: 0,
      },
      heavy: {
        from: 0,
        to: 6,
        boxes: {
          e: { x: 0, y: -28, w: 24, h: 28 },
          w: { x: -24, y: -28, w: 24, h: 28 },
          s: { x: -12, y: -12, w: 24, h: 24 },
          n: { x: -12, y: -38, w: 24, h: 26 },
        },
        amount: 4,
        knock: 6,
        tags: HEAVY,
      },
    },
  },
} as const satisfies Record<EnemyId, EnemyDef>;
