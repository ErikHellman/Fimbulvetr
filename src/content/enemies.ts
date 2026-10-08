import type { AttackWindow, EnemyDef } from '@core/actors/enemies/defs';
import type { Box } from '@core/math/box';
import { ARROW, HAMMER, HEAVY, PIERCE_SHIELD, REFLECT } from '@core/combat/hit';
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
  /**
   * A drowned thrall of Sökkva Hof (M7b): a draugr that walks the bottom of the flooded floors as well as
   * the dry ones. It rises, raises both arms and brings them down; only a dive passes under the blow.
   */
  drowned: {
    id: 'drowned',
    art: 'enemy_drowned',
    hp: 8,
    body: { x: -6, y: -8, w: 12, h: 8 },
    hurt: { x: -7, y: -26, w: 14, h: 26 },
    behaviour: 'draugr',
    swims: true,
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
  /**
   * Hrönn, the great eel of Sökkva Hof's round hall (see hronn.ts): it lies under its four grates in turn
   * and bites from them; a bomb in the grate it lies under stuns it. A mini-boss: Vindr's stave lies behind.
   */
  hronn: {
    id: 'hronn',
    art: 'enemy_hronn',
    hp: 16,
    body: { x: -12, y: -8, w: 24, h: 8 },
    hurt: { x: -14, y: -36, w: 28, h: 36 },
    behaviour: 'hronn',
    swims: true,
    knockResist: 1,
    immortal: false,
    solid: false,
    needs: ['bombs'],
    boss: { name: { en: 'Hrönn', sv: 'Hrönn' }, mini: true },
    attacks: {
      surface: {
        from: 24,
        to: 40,
        boxes: around({ x: -24, y: -34, w: 48, h: 44 }),
        amount: 3,
        knock: 5,
        tags: HEAVY,
      },
    },
  },
  /** One of Hrönn's iron grates: the blade rings off; a blast bursts it, and bombs spill out. */
  hronn_grate: {
    id: 'hronn_grate',
    art: 'enemy_hronn_grate',
    hp: 1,
    body: { x: -10, y: -10, w: 20, h: 10 },
    hurt: { x: -11, y: -14, w: 22, h: 14 },
    behaviour: 'hronn_grate',
    knockResist: 1,
    immortal: false,
    solid: true,
    guard: true,
    cracks: 'force',
    drops: { heart: 0, silver: 0, bombs: 1, none: 0 },
  },
  /**
   * Thane Nykr, the Tide (see nykr.ts): a water horse circling its pool about a stone island. Vindr blows it
   * onto the stone while it rears; at the last it rides a whirlpool until the grapple drags it out. The
   * boss of Sökkva Hof.
   */
  nykr: {
    id: 'nykr',
    art: 'enemy_nykr',
    hp: 30,
    body: { x: -14, y: -10, w: 28, h: 10 },
    hurt: { x: -18, y: -40, w: 36, h: 40 },
    behaviour: 'nykr',
    swims: true,
    knockResist: 1,
    immortal: false,
    solid: false,
    needs: ['grapple'],
    boss: { name: { en: 'Nykr', sv: 'Nykr' } },
    touch: { amount: 2, knock: 5, tags: 0 },
    attacks: {
      wave: {
        from: 4,
        to: 14,
        boxes: around({ x: -72, y: -60, w: 144, h: 100 }),
        amount: 3,
        knock: 6,
        tags: HEAVY,
      },
      charge: {
        from: 0,
        to: 69,
        boxes: around({ x: -20, y: -34, w: 40, h: 36 }),
        amount: 4,
        knock: 6,
        tags: HEAVY,
      },
    },
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
  /**
   * The mara (Niflmýrr, by night): unseen until three tiles off, it shows itself crouched (400 ms) and
   * leaps. Landed, it rides Ask and drains seiðr until a roll throws it off (see mara.ts, systems/mara.ts).
   */
  mara: {
    id: 'mara',
    art: 'enemy_mara',
    hp: 6,
    body: { x: -5, y: -6, w: 10, h: 6 },
    hurt: { x: -7, y: -22, w: 14, h: 22 },
    behaviour: 'mara',
    weak: ['fire'],
    knockResist: 0.3,
    immortal: false,
    solid: false,
    flies: true,
    stunnable: 90,
    drops: { heart: 2, silver: 2, seidr: 3, none: 3 },
  },
  /**
   * A fog-draugr (Niflmýrr and Helgrind): a faint swirl in the mist until Ask passes with their back to it,
   * then it rises behind them, stalks, raises its blade (400 ms) and cuts.
   */
  fog_draugr: {
    id: 'fog_draugr',
    art: 'enemy_fog_draugr',
    hp: 6,
    body: { x: -6, y: -8, w: 12, h: 8 },
    hurt: { x: -7, y: -26, w: 14, h: 26 },
    behaviour: 'fog_draugr',
    weak: ['fire'],
    knockResist: 0.3,
    immortal: false,
    solid: false,
    attacks: {
      swing: {
        from: 0,
        to: 5,
        boxes: {
          e: { x: 0, y: -24, w: 22, h: 24 },
          w: { x: -22, y: -24, w: 22, h: 24 },
          s: { x: -12, y: -12, w: 24, h: 22 },
          n: { x: -12, y: -34, w: 24, h: 24 },
        },
        amount: 3,
        knock: 4,
        tags: 0,
      },
    },
    stunnable: 120,
    light: true,
    drops: { heart: 3, silver: 3, none: 3 },
  },
  /**
   * A marbendill (Niflmýrr's strand at night, Sævatn): climbs out of the water, crouches with its hands out
   * (400 ms) and springs to grab, hauling Ask in. Struck, it scrambles away with its back open.
   */
  marbendill: {
    id: 'marbendill',
    art: 'enemy_marbendill',
    hp: 8,
    body: { x: -6, y: -8, w: 12, h: 8 },
    hurt: { x: -7, y: -24, w: 14, h: 24 },
    behaviour: 'marbendill',
    knockResist: 0.2,
    immortal: false,
    solid: false,
    attacks: {
      grab: {
        from: 0,
        to: 8,
        boxes: {
          e: { x: 0, y: -22, w: 20, h: 22 },
          w: { x: -20, y: -22, w: 20, h: 22 },
          s: { x: -10, y: -10, w: 20, h: 20 },
          n: { x: -10, y: -30, w: 20, h: 22 },
        },
        amount: 2,
        // A grab hauls Ask in towards the water rather than throwing them back.
        knock: -3,
        tags: 0,
      },
    },
    stunnable: 90,
    light: true,
    drops: { heart: 3, silver: 2, none: 2 },
  },
  /**
   * A nykr foal, a small water horse of Sævatn: circles under the surface out of reach, rears (400 ms) and
   * lunges, up onto the bank if Ask stands there, where it flounders open to the blade (see nykr_foal.ts).
   */
  nykr_foal: {
    id: 'nykr_foal',
    art: 'enemy_nykr_foal',
    hp: 3,
    body: { x: -7, y: -8, w: 14, h: 8 },
    hurt: { x: -10, y: -18, w: 20, h: 18 },
    behaviour: 'nykr_foal',
    knockResist: 0.5,
    immortal: false,
    solid: false,
    swims: true,
    attacks: {
      lunge: {
        from: 0,
        to: 14,
        boxes: {
          e: { x: 0, y: -16, w: 18, h: 16 },
          w: { x: -18, y: -16, w: 18, h: 16 },
          s: { x: -9, y: -10, w: 18, h: 18 },
          n: { x: -9, y: -24, w: 18, h: 18 },
        },
        amount: 2,
        knock: 3,
        tags: 0,
      },
    },
    stunnable: 90,
    drops: { heart: 2, silver: 3, none: 2 },
  },
  /** Hel's black hounds: stalk like vargr, and lunge in pairs (see helhound.ts). Light enough to drag. */
  helhound: {
    id: 'helhound',
    art: 'enemy_helhound',
    hp: 6,
    body: { x: -7, y: -8, w: 14, h: 8 },
    hurt: { x: -10, y: -16, w: 20, h: 16 },
    behaviour: 'helhound',
    knockResist: 0,
    immortal: false,
    solid: false,
    touch: { amount: 1, knock: 2, tags: 0 },
    attacks: {
      lunge: {
        from: 0,
        to: 13,
        boxes: around({ x: -9, y: -14, w: 18, h: 14 }),
        amount: 3,
        knock: 4,
        tags: 0,
      },
    },
    stunnable: 120,
    light: true,
    weak: ['fire'],
    drops: { heart: 3, silver: 3, none: 4 },
  },
  /**
   * Garmr, the hound at Hel's gate (see garmr.ts): its hide turns every blow until the grapple, hooked in its
   * collar ring, drags it off its feet. A mini-boss: the grapple chest lies at its feet.
   */
  garmr: {
    id: 'garmr',
    art: 'enemy_garmr',
    hp: 24,
    body: { x: -14, y: -10, w: 28, h: 10 },
    hurt: { x: -18, y: -30, w: 36, h: 30 },
    behaviour: 'garmr',
    knockResist: 1,
    immortal: false,
    solid: true,
    needs: ['grapple'],
    boss: { name: { en: 'Garmr', sv: 'Garm' }, mini: true },
    touch: { amount: 2, knock: 5, tags: 0 },
    attacks: {
      breath: {
        from: 0,
        to: 26,
        boxes: {
          e: { x: 4, y: -34, w: 52, h: 40 },
          w: { x: -56, y: -34, w: 52, h: 40 },
          s: { x: -26, y: -4, w: 52, h: 48 },
          n: { x: -26, y: -74, w: 52, h: 48 },
        },
        amount: 3,
        knock: 4,
        tags: 0,
      },
      lunge: {
        from: 0,
        to: 19,
        boxes: around({ x: -18, y: -28, w: 36, h: 28 }),
        amount: 4,
        knock: 6,
        tags: HEAVY,
      },
    },
  },
  /**
   * Thane Náströnd, the Hollow (see nastrond.ts): a draugr lord behind a tower shield the grapple tears
   * away. Three phases; the boss of Helgrind.
   */
  nastrond: {
    id: 'nastrond',
    art: 'enemy_nastrond',
    hp: 30,
    body: { x: -12, y: -10, w: 24, h: 10 },
    hurt: { x: -14, y: -44, w: 28, h: 44 },
    behaviour: 'nastrond',
    knockResist: 1,
    immortal: false,
    solid: true,
    needs: ['grapple'],
    boss: { name: { en: 'Náströnd', sv: 'Náströnd' } },
    attacks: {
      cut: {
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
        tags: 0,
      },
      flail: {
        from: 4,
        to: 20,
        boxes: around({ x: -48, y: -60, w: 96, h: 76 }),
        amount: 4,
        knock: 8,
        tags: 0,
      },
    },
  },
  /** Náströnd's tower shield, lying where the grapple flung it until he takes it up (see nastrond.ts). */
  tower_shield: {
    id: 'tower_shield',
    art: 'enemy_tower_shield',
    hp: 1,
    body: { x: -8, y: -6, w: 16, h: 6 },
    hurt: { x: -8, y: -14, w: 16, h: 14 },
    behaviour: 'tower_shield',
    knockResist: 1,
    immortal: true,
    solid: false,
    guard: true,
  },
  /**
   * An iron warden of Dvergagröf (M8): a dwarf-wrought construct that wakes as Ask comes near, plods
   * after Ask, raises its fists (500 ms) and brings them down. Its plates turn every blade until a
   * blast (or the hammer) cracks them; then the sword bites.
   */
  jarnvordr: {
    id: 'jarnvordr',
    art: 'enemy_jarnvordr',
    hp: 12,
    body: { x: -7, y: -8, w: 14, h: 8 },
    hurt: { x: -9, y: -28, w: 18, h: 28 },
    behaviour: 'draugr',
    knockResist: 0.8,
    immortal: false,
    solid: false,
    guard: true,
    cracks: 'force',
    needs: ['bombs'],
    touch: { amount: 1, knock: 2, tags: 0 },
    attacks: {
      swing: {
        from: 0,
        to: 6,
        boxes: {
          e: { x: 0, y: -28, w: 24, h: 28 },
          w: { x: -24, y: -28, w: 24, h: 28 },
          s: { x: -12, y: -12, w: 24, h: 24 },
          n: { x: -12, y: -38, w: 24, h: 26 },
        },
        amount: 4,
        knock: 5,
        tags: HEAVY,
      },
    },
    stunnable: 60,
    drops: { heart: 2, silver: 3, bombs: 3, none: 2 },
  },
  /**
   * An ember sprite of the vents and forges (M8): it drifts toward Ask, flares (400 ms) and darts. Ís
   * puts it out at once.
   */
  glod: {
    id: 'glod',
    art: 'enemy_glod',
    hp: 2,
    body: { x: -4, y: -4, w: 8, h: 4 },
    hurt: { x: -7, y: -20, w: 14, h: 14 },
    behaviour: 'myrljos',
    knockResist: 0,
    immortal: false,
    solid: false,
    flies: true,
    glow: 40,
    weak: ['ice'],
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
    drops: { heart: 1, silver: 1, seidr: 2, none: 3 },
  },
  /**
   * Belgr, the bellows construct (M8b, D6's mini-boss, guarding the hammer): its iron turns every blow; its
   * bellows swell (667 ms) and it breathes a cone of fire, then draws air with its intake open. A bomb's
   * blast in the intake staggers it, and the sword bites.
   */
  belgr: {
    id: 'belgr',
    art: 'enemy_belgr',
    hp: 16,
    body: { x: -14, y: -10, w: 28, h: 10 },
    hurt: { x: -16, y: -40, w: 32, h: 40 },
    behaviour: 'belgr',
    knockResist: 1,
    immortal: false,
    solid: false,
    needs: ['bombs'],
    boss: { name: { en: 'Belgr', sv: 'Belgr' }, mini: true },
    struckBy: HEAVY,
    touch: { amount: 2, knock: 5, tags: 0 },
    attacks: {
      breathe: {
        from: 4,
        to: 32,
        boxes: {
          s: { x: -18, y: 0, w: 36, h: 44 },
          n: { x: -18, y: -84, w: 36, h: 44 },
          e: { x: 10, y: -30, w: 48, h: 34 },
          w: { x: -58, y: -30, w: 48, h: 34 },
        },
        amount: 4,
        knock: 4,
        tags: 0,
      },
    },
    drops: { heart: 1, silver: 0, none: 0 },
  },
  /**
   * Thane Ívaldi, the Anvil (M8b, D6's boss): plated armour that turns every blow but the dwarf hammer's
   * on an opening (his hammer stuck in the floor; thrown off his anvil by Skjálfti; cooled by Ís when
   * white-hot). See `IVALDI_MACHINE`.
   */
  ivaldi: {
    id: 'ivaldi',
    art: 'enemy_ivaldi',
    hp: 24,
    body: { x: -12, y: -10, w: 24, h: 10 },
    hurt: { x: -14, y: -44, w: 28, h: 44 },
    behaviour: 'ivaldi',
    knockResist: 1,
    immortal: false,
    solid: false,
    needs: ['hammer'],
    boss: { name: { en: 'Ívaldi', sv: 'Ívaldi' } },
    struckBy: HAMMER,
    touch: { amount: 2, knock: 5, tags: 0 },
    attacks: {
      slam: {
        from: 0,
        to: 10,
        boxes: {
          s: { x: -10, y: -4, w: 20, h: 100 },
          n: { x: -10, y: -112, w: 20, h: 100 },
          e: { x: 6, y: -18, w: 100, h: 20 },
          w: { x: -106, y: -18, w: 100, h: 20 },
        },
        amount: 4,
        knock: 5,
        tags: HEAVY,
      },
      quake: {
        from: 0,
        to: 8,
        boxes: around({ x: -56, y: -52, w: 112, h: 88 }),
        amount: 3,
        knock: 6,
        tags: HEAVY,
      },
    },
    drops: { heart: 0, silver: 0, none: 1 },
  },
  /** An ice wolf of Hrímfjöll (M9): the wolf's stalk, crouch (400 ms) and lunge, harder and hardier; fire bites it twice as hard. */
  isvargr: {
    id: 'isvargr',
    art: 'enemy_isvargr',
    hp: 10,
    body: { x: -7, y: -8, w: 14, h: 8 },
    hurt: { x: -10, y: -16, w: 20, h: 16 },
    behaviour: 'vargr',
    knockResist: 0.2,
    immortal: false,
    solid: false,
    weak: ['fire'],
    touch: { amount: 2, knock: 2, tags: 0 },
    attacks: {
      lunge: {
        from: 0,
        to: 13,
        boxes: around({ x: -9, y: -14, w: 18, h: 14 }),
        amount: 3,
        knock: 4,
        tags: 0,
      },
    },
    stunnable: 120,
    drops: { heart: 2, silver: 3, arrows: 1, none: 4 },
  },
  /**
   * A frost wisp (M9): drifts to line up with Ask on a row or column, glows (400 ms) and looses a rime bolt
   * straight along it. Fire puts it out at a touch; the ice mirror sends its bolt back (M9b).
   */
  frostvaettr: {
    id: 'frostvaettr',
    art: 'enemy_frostvaettr',
    hp: 3,
    body: { x: -4, y: -4, w: 8, h: 4 },
    hurt: { x: -7, y: -20, w: 14, h: 14 },
    behaviour: 'frostvaettr',
    knockResist: 0,
    immortal: false,
    solid: false,
    flies: true,
    glow: 32,
    weak: ['fire'],
    stunnable: 90,
    drops: { heart: 1, silver: 1, seidr: 2, none: 3 },
  },
  /**
   * Svellr, the glacier construct (D7's mini-boss, M9b): it scrapes the floor squared up on Ask, charges
   * straight across the hall and stuns itself on the wall, cracked open to the sword. It guards the mirror.
   */
  svellr: {
    id: 'svellr',
    art: 'enemy_svellr',
    hp: 14,
    body: { x: -14, y: -10, w: 28, h: 10 },
    hurt: { x: -16, y: -36, w: 32, h: 36 },
    behaviour: 'svellr',
    knockResist: 1,
    immortal: false,
    solid: false,
    boss: { name: { en: 'Svellr', sv: 'Svellr' }, mini: true },
    touch: { amount: 2, knock: 4, tags: 0 },
    attacks: {
      charge: {
        from: 0,
        to: 150,
        boxes: around({ x: -16, y: -24, w: 32, h: 24 }),
        amount: 4,
        knock: 6,
        tags: HEAVY,
      },
    },
    drops: { heart: 1, silver: 0, none: 0 },
  },
  /**
   * Thane Hrímgerðr, the Glass (D7's boss, M9b): she casts rime bolts along rows and columns; every blow
   * turns off her, but her own bolt sent back by the ice mirror makes her kneel, open to the sword.
   */
  hrimgerdr: {
    id: 'hrimgerdr',
    art: 'enemy_hrimgerdr',
    hp: 18,
    body: { x: -12, y: -10, w: 24, h: 10 },
    hurt: { x: -14, y: -52, w: 28, h: 52 },
    behaviour: 'hrimgerdr',
    knockResist: 1,
    immortal: false,
    solid: true,
    needs: ['mirror'],
    boss: { name: { en: 'Hrímgerðr', sv: 'Hrímgerðr' } },
    struckBy: REFLECT,
    touch: { amount: 2, knock: 5, tags: 0 },
    drops: { heart: 0, silver: 0, none: 1 },
  },
  /** An icicle from Hrímgerðr's roof (M9b): its shadow grows where Ask stood, then it falls. */
  icicle: {
    id: 'icicle',
    art: 'enemy_icicle',
    hp: 1,
    body: { x: -6, y: -6, w: 12, h: 6 },
    hurt: { x: -7, y: -10, w: 14, h: 10 },
    behaviour: 'icicle',
    knockResist: 1,
    immortal: true,
    solid: false,
    attacks: {
      fall: {
        from: 6,
        to: 9,
        boxes: around({ x: -9, y: -12, w: 18, h: 12 }),
        amount: 3,
        knock: 3,
        tags: PIERCE_SHIELD,
      },
    },
  },
  /**
   * Jötunvörðr, the frost-giant warden of Útgarðr's master key (D8's mini-boss, M10a): frozen hard, every
   * blow turns off him until Eldr thaws him; he raises a knee (the tell) and stomps a ring of shock.
   */
  jotunvordr: {
    id: 'jotunvordr',
    art: 'enemy_jotunvordr',
    hp: 16,
    body: { x: -12, y: -10, w: 24, h: 10 },
    hurt: { x: -14, y: -50, w: 28, h: 50 },
    behaviour: 'jotunvordr',
    knockResist: 1,
    immortal: false,
    solid: true,
    guard: true,
    cracks: 'fire',
    boss: { name: { en: 'Jötunvörðr', sv: 'Jötunvörðr' }, mini: true },
    touch: { amount: 2, knock: 5, tags: 0 },
    attacks: {
      stomp: {
        from: 0,
        to: 6,
        boxes: around({ x: -44, y: -30, w: 88, h: 50 }),
        amount: 4,
        knock: 7,
        tags: HEAVY,
      },
    },
    drops: { heart: 1, silver: 0, none: 0 },
  },
  /**
   * Kolbeinn in his hall (D8, M10a): a duel won by the parry. His staff turns blows from the front; a parry
   * staggers him open; from half health his rime bolt (sent back by the mirror) makes him reel; at a quarter he
   * calls two draugr. Beaten, he kneels, and Ask spares or kills him.
   */
  kolbeinn_boss: {
    id: 'kolbeinn_boss',
    art: 'enemy_kolbeinn',
    hp: 16,
    body: { x: -6, y: -8, w: 12, h: 8 },
    hurt: { x: -8, y: -28, w: 16, h: 28 },
    behaviour: 'kolbeinn',
    knockResist: 0.7,
    immortal: false,
    solid: true,
    shield: true,
    struckBy: REFLECT,
    parryStun: 70,
    boss: { name: { en: 'Kolbeinn', sv: 'Kolbeinn' }, mini: true },
    attacks: {
      strike: {
        from: 0,
        to: 6,
        boxes: {
          e: { x: 0, y: -26, w: 24, h: 24 },
          w: { x: -24, y: -26, w: 24, h: 24 },
          s: { x: -12, y: -12, w: 24, h: 24 },
          n: { x: -12, y: -38, w: 24, h: 26 },
        },
        amount: 3,
        knock: 5,
        tags: 0,
      },
    },
    drops: { heart: 0, silver: 0, none: 1 },
  },
  /**
   * Hrímnir the Rime King (D8's boss, M10b): every blow turns until his struck hand or his own breath off the
   * mirror bares his heart-rune; the binding's ring is the fight's clock (see hrimnir.ts and binding.ts).
   */
  hrimnir: {
    id: 'hrimnir',
    art: 'enemy_hrimnir',
    hp: 24,
    body: { x: -20, y: -12, w: 40, h: 12 },
    hurt: { x: -22, y: -70, w: 44, h: 70 },
    behaviour: 'hrimnir',
    knockResist: 1,
    immortal: false,
    solid: true,
    needs: ['mirror'],
    boss: { name: { en: 'Hrímnir, the Rime King', sv: 'Hrímnir, Rimkungen' } },
    struckBy: REFLECT,
    touch: { amount: 3, knock: 6, tags: 0 },
    drops: { heart: 0, silver: 0, none: 1 },
  },
  /** Hrímnir's hand sweeping across a row of his hall: a blow on it stuns him (M10b). */
  hrimnir_hand: {
    id: 'hrimnir_hand',
    art: 'enemy_hrimnir_hand',
    hp: 1,
    body: { x: -10, y: -8, w: 20, h: 8 },
    hurt: { x: -14, y: -22, w: 28, h: 22 },
    behaviour: 'hrimnir_hand',
    knockResist: 1,
    immortal: true,
    solid: false,
    attacks: {
      sweep: {
        from: 0,
        to: 999,
        boxes: around({ x: -14, y: -20, w: 28, h: 20 }),
        amount: 4,
        knock: 6,
        tags: HEAVY,
      },
    },
  },
  /** A rime pillar Hrímnir pulls down (M10b): its shadow, the fall, and its wreck lying as glaze. */
  rime_pillar: {
    id: 'rime_pillar',
    art: 'enemy_rime_pillar',
    hp: 1,
    body: { x: -6, y: -6, w: 12, h: 6 },
    hurt: { x: -7, y: -10, w: 14, h: 10 },
    behaviour: 'rime_pillar',
    knockResist: 1,
    immortal: true,
    solid: false,
    attacks: {
      fall: {
        from: 6,
        to: 9,
        boxes: around({ x: -18, y: -24, w: 36, h: 28 }),
        amount: 4,
        knock: 4,
        tags: PIERCE_SHIELD,
      },
    },
  },
} as const satisfies Record<EnemyId, EnemyDef>;
