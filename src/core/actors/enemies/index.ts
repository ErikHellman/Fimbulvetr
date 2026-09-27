import type { Vec } from '../../math/vec';
import { createEntity, type Entity } from '../entity';
import type { Machine } from '../fsm';
import type { ActorCtx, EnemyDef } from './defs';
import { DRAUGR_MACHINE } from './draugr';
import { DUMMY_MACHINE } from './dummy';
import { TROLL_MACHINE } from './troll';
import { VARGR_MACHINE } from './vargr';

const MACHINES = {
  dummy: DUMMY_MACHINE,
  vargr: VARGR_MACHINE,
  draugr: DRAUGR_MACHINE,
  troll: TROLL_MACHINE,
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
