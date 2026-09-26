import type { PropDef } from '@core/actors/prop';
import type { PropId } from './ids';

const SMALL = { x: -6, y: -8, w: 12, h: 8 };
const SMALL_HURT = { x: -7, y: -14, w: 14, h: 14 };
const LARGE = { x: -7, y: -10, w: 14, h: 10 };
const LARGE_HURT = { x: -8, y: -16, w: 16, h: 16 };

export const PROP_DEFS = {
  pot: {
    id: 'pot',
    art: 'prop_pot',
    body: SMALL,
    hurt: SMALL_HURT,
    liftable: true,
    fragile: true,
    throwDamage: 4,
  },
  stone: {
    id: 'stone',
    art: 'prop_stone',
    body: SMALL,
    hurt: SMALL_HURT,
    liftable: true,
    fragile: true,
    throwDamage: 4,
  },
  rock: {
    id: 'rock',
    art: 'prop_rock',
    body: LARGE,
    hurt: LARGE_HURT,
    liftable: true,
    fragile: true,
    throwDamage: 6,
  },
  pail: {
    id: 'pail',
    art: 'prop_pail',
    body: SMALL,
    hurt: SMALL_HURT,
    liftable: true,
    fragile: false,
    throwDamage: 2,
  },
  log_small: {
    id: 'log_small',
    art: 'prop_log_small',
    body: SMALL,
    hurt: SMALL_HURT,
    liftable: false,
    fragile: false,
    breakBy: 'sword',
    throwDamage: 0,
  },
  log_big: {
    id: 'log_big',
    art: 'prop_log_big',
    body: LARGE,
    hurt: LARGE_HURT,
    liftable: false,
    fragile: false,
    breakBy: 'spin',
    throwDamage: 0,
  },
} as const satisfies Record<PropId, PropDef>;
