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

const MACHINES = {
  dummy: DUMMY_MACHINE,
  vargr: VARGR_MACHINE,
  draugr: DRAUGR_MACHINE,
  troll: TROLL_MACHINE,
  root_biter: ROOT_BITER_MACHINE,
  rotvaettr: ROTVAETTR_MACHINE,
  rot_bulb: BULB_MACHINE,
  root_spike: SPIKE_MACHINE,
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
