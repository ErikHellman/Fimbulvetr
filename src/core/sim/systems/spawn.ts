import type { Entity } from '../../actors/entity';
import { createEnemy } from '../../actors/enemies';
import { createProp } from '../../actors/prop';
import { evalCond } from '../../story/cond';
import { tileFeet } from '../../world/screen';
import type { SimRt } from '../rt';
import { placeNpcs } from './npcs';
import { condCtx } from './story';

/** Builds the live actors of the current screen from its things. */
export function spawnActors(rt: SimRt): Entity[] {
  rt.actors = spawnThings(rt);
  placeNpcs(rt);
  return rt.actors;
}

function spawnThings(rt: SimRt): Entity[] {
  const out: Entity[] = [];
  const ctx = condCtx(rt);
  rt.db.screens[rt.screen.id].things.forEach((thing, index) => {
    switch (thing.k) {
      case 'enemy':
        out.push(createEnemy(rt.newId(), rt.db.enemies[thing.id], tileFeet(thing.at)));
        break;
      case 'prop':
        if (evalCond(thing.when, ctx))
          out.push(createProp(rt.newId(), rt.db.props[thing.id], tileFeet(thing.at), index));
        break;
      case 'door':
      case 'sign':
      case 'use':
      case 'trigger':
      case 'drop':
        break;
      default: {
        const never: never = thing;
        throw new Error(`unknown thing ${JSON.stringify(never)}`);
      }
    }
  });
  return out;
}
