import type { CritterDef } from '@core/actors/critters';
import type { CritterId } from './ids';

export const CRITTER_DEFS = {
  sheep: {
    id: 'sheep',
    art: 'critter_sheep',
    body: { x: -7, y: -8, w: 14, h: 8 },
    hurt: { x: -8, y: -16, w: 16, h: 16 },
    behaviour: 'sheep',
    solid: true,
    scaredByThrow: false,
  },
  raven: {
    id: 'raven',
    art: 'critter_raven',
    body: { x: -4, y: -4, w: 8, h: 4 },
    hurt: { x: -7, y: -12, w: 14, h: 12 },
    behaviour: 'raven',
    solid: false,
    scaredByThrow: true,
  },
} as const satisfies Record<CritterId, CritterDef>;
