import type { Vec } from '../../math/vec';
import { createEntity, type Entity } from '../entity';
import type { Machine } from '../fsm';
import type { ActorCtx, EnemyDef } from './defs';
import { DRAUGR_MACHINE } from './draugr';
import { DUMMY_MACHINE } from './dummy';
import { ROOT_BITER_MACHINE } from './root_biter';
import { BULB_MACHINE, ROTVAETTR_MACHINE, SPIKE_MACHINE } from './rotvaettr';
import { TROLL_MACHINE } from './troll';
import { VARGR_MACHINE } from './vargr';
import { ALPHA_MACHINE } from './alpha';
import { RIME_RAVEN_MACHINE } from './raven';
import { VATNORMR_MACHINE } from './worm';
import { MYRLJOS_MACHINE } from './wisp';
import { LEIRKRABBI_MACHINE } from './crab';
import { LINDORMR_MACHINE, MOUND_MACHINE } from './lindormr';
import { HAUGBUI_MACHINE } from './haugbui';
import { BOGDRAUGR_MACHINE } from './archer';
import { HAUGVORDR_MACHINE } from './warden';
import { KING_MACHINE } from './king';

const MACHINES = {
  dummy: DUMMY_MACHINE,
  vargr: VARGR_MACHINE,
  draugr: DRAUGR_MACHINE,
  troll: TROLL_MACHINE,
  root_biter: ROOT_BITER_MACHINE,
  rotvaettr: ROTVAETTR_MACHINE,
  rot_bulb: BULB_MACHINE,
  root_spike: SPIKE_MACHINE,
  vargr_alpha: ALPHA_MACHINE,
  rime_raven: RIME_RAVEN_MACHINE,
  vatnormr: VATNORMR_MACHINE,
  myrljos: MYRLJOS_MACHINE,
  leirkrabbi: LEIRKRABBI_MACHINE,
  lindormr: LINDORMR_MACHINE,
  lind_mound: MOUND_MACHINE,
  haugbui: HAUGBUI_MACHINE,
  bogdraugr: BOGDRAUGR_MACHINE,
  haugvordr: HAUGVORDR_MACHINE,
  haugkonungr: KING_MACHINE,
};

export type BehaviourId = keyof typeof MACHINES;

/** Behaviour code by id. Content refers to these ids; an unknown id is a compile error. */
export const BEHAVIOURS: Readonly<Record<BehaviourId, Machine<string, ActorCtx>>> = MACHINES;

/** The state each behaviour starts in. */
const START: Readonly<Record<BehaviourId, string>> = {
  dummy: 'idle',
  vargr: 'prowl',
  draugr: 'rise',
  troll: 'stomp',
  root_biter: 'buried',
  rotvaettr: 'wake',
  rot_bulb: 'glow',
  root_spike: 'tell',
  vargr_alpha: 'prowl',
  rime_raven: 'circle',
  vatnormr: 'under',
  myrljos: 'drift',
  leirkrabbi: 'sidle',
  lindormr: 'wake',
  lind_mound: 'mound',
  haugbui: 'rise',
  bogdraugr: 'rise',
  haugvordr: 'stand',
  haugkonungr: 'throne',
};

export function createEnemy(id: number, def: EnemyDef, pos: Vec): Entity {
  return createEntity({
    id,
    kind: 'enemy',
    def: def.id,
    art: def.art,
    pos,
    facing: 's',
    body: def.body,
    hurt: def.hurt,
    faction: 'enemy',
    hp: def.hp,
    maxHp: def.hp,
    state: START[def.behaviour],
  });
}
