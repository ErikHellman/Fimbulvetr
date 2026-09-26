import type { Vec } from '../../math/vec';
import { createEntity, type Entity } from '../entity';
import type { Machine } from '../fsm';
import type { EnemyCtx, EnemyDef } from './defs';
import { DUMMY_MACHINE } from './dummy';

/** Behaviour code by id. Content refers to these ids; an unknown id is a compile error. */
export const BEHAVIOURS = {
  dummy: DUMMY_MACHINE,
} satisfies Record<string, Machine<string, EnemyCtx>>;

export type BehaviourId = keyof typeof BEHAVIOURS;

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
    state: 'idle',
  });
}
