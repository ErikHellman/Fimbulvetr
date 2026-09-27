import type { AttackWindow, EnemyDef } from '@core/actors/enemies/defs';
import type { Box } from '@core/math/box';
import { HEAVY, PIERCE_SHIELD } from '@core/combat/hit';
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
} as const satisfies Record<EnemyId, EnemyDef>;
