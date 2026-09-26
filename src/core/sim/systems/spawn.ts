import type { Entity } from '../../actors/entity';
import { createEnemy } from '../../actors/enemies';
import { createCritter } from '../../actors/critters';
import { createProp } from '../../actors/prop';
import { evalCond } from '../../story/cond';
import { tileFeet } from '../../world/screen';
import type { SimRt } from '../rt';
import { penOf } from './critters';
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
      case 'critter': {
        if (!evalCond(thing.when, ctx)) break;
        const pen = penOf(rt);
        const tag = thing.tag;
        let at = thing.at;
        let penned = false;
        if (pen !== null && tag !== undefined && ((rt.state.world.vars[pen.v] ?? 0) & (1 << tag)) !== 0) {
          penned = true;
          at = { x: pen.at.x + (tag % pen.w), y: pen.at.y + (Math.floor(tag / pen.w) % pen.h) };
        }
        const e = createCritter(rt.newId(), rt.db.critters[thing.id], tileFeet(at), index);
        if (tag !== undefined) e.mem['tag'] = tag;
        if (penned) e.mem['penned'] = 1;
        out.push(e);
        break;
      }
      case 'door':
      case 'sign':
      case 'use':
      case 'trigger':
      case 'drop':
      case 'pen':
        break;
      default: {
        const never: never = thing;
        throw new Error(`unknown thing ${JSON.stringify(never)}`);
      }
    }
  });
  return out;
}
