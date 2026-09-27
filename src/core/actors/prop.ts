import type { PropId } from '@content/ids';
import type { DropKind } from '../combat/drops';
import type { Box } from '../math/box';
import type { Vec } from '../math/vec';
import { createEntity, type Entity } from './entity';

/** A thing on the ground: something to lift and throw (pots, stones, the pail) or to split (logs). */
export interface PropDef {
  readonly id: PropId;
  readonly art: string;
  readonly body: Box;
  readonly hurt: Box;
  /** Can be lifted with interact and carried overhead. */
  readonly liftable: boolean;
  /** Shatters when a throw lands or hits something. */
  readonly fragile: boolean;
  /** Breaks in place when hit by any sword swing, or only by the spin. */
  readonly breakBy?: 'sword' | 'spin';
  /** Quarter hearts dealt when thrown into something. */
  readonly throwDamage: number;
  /** Fills its tile like a wall (stamped into collision, so enemies are stopped too). */
  readonly wall?: boolean;
  /** Slides a tile when Ask pushes against it steadily (a root block); back in place on the next visit. */
  readonly pushable?: boolean;
  /** What spills out when it breaks (a troll stone's hoard). */
  readonly loot?: readonly DropKind[];
  /** Fire burns it away (brambles); the sword does not. */
  readonly burns?: boolean;
}

export function createProp(id: number, def: PropDef, pos: Vec, thingIndex: number): Entity {
  const e = createEntity({
    id,
    kind: 'prop',
    def: def.id,
    art: def.art,
    pos,
    facing: 's',
    body: def.body,
    hurt: def.hurt,
    faction: 'env',
    hp: 1,
    maxHp: 1,
    state: 'rest',
  });
  e.mem['thing'] = thingIndex;
  return e;
}
