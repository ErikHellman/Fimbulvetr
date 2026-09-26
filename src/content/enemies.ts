import type { EnemyDef } from '@core/actors/enemies/defs';
import type { EnemyId } from './ids';

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
} as const satisfies Record<EnemyId, EnemyDef>;
