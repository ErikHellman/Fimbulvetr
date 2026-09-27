import type { Entity } from '../../actors/entity';
import { createEnemy } from '../../actors/enemies';
import { createCritter } from '../../actors/critters';
import { createProp } from '../../actors/prop';
import { dungeonOf } from '../../state/dungeons';
import { evalCond } from '../../story/cond';
import { tileFeet } from '../../world/screen';
import type { SimRt } from '../rt';
import { penOf } from './critters';
import { refreshFixtures, spawnFixtures, stampCollision } from './fixtures';
import { createHeart, createPiece } from './pickups';
import { placeNpcs } from './npcs';
import { holdBack } from './rooms';
import { condCtx } from './story';

/** Whether the current room's dungeon has lost its boss (who then never comes back). */
function bossDown(rt: SimRt): boolean {
  const dungeon = rt.db.screens[rt.screen.id].dungeon;
  return dungeon !== undefined && dungeonOf(rt.state, dungeon).bossDead;
}

/** Builds the live actors of the current screen from its things. */
export function spawnActors(rt: SimRt): Entity[] {
  rt.actors = spawnThings(rt);
  for (const e of rt.actors) holdBack(rt, e);
  placeNpcs(rt);
  refreshFixtures(rt, false);
  stampCollision(rt);
  return rt.actors;
}

function spawnThings(rt: SimRt): Entity[] {
  const out: Entity[] = [];
  const ctx = condCtx(rt);
  rt.db.screens[rt.screen.id].things.forEach((thing, index) => {
    switch (thing.k) {
      case 'enemy': {
        const def = rt.db.enemies[thing.id];
        if (!evalCond(thing.when, ctx) || (def.boss !== undefined && bossDown(rt))) break;
        const e = createEnemy(rt.newId(), def, tileFeet(thing.at));
        // The thing index is only kept for enemies that do something when they die.
        if (thing.onDeath !== undefined) e.mem['thing'] = index;
        out.push(e);
        break;
      }
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
      case 'piece':
        if (!rt.state.world.pieces.includes(thing.id))
          out.push(createPiece(rt.newId(), tileFeet(thing.at), index));
        break;
      case 'heart':
        if (!rt.state.world.opened.includes(thing.id))
          out.push(createHeart(rt.newId(), tileFeet(thing.at), index));
        break;
      case 'fire':
      case 'gate':
      case 'chest':
      case 'lock':
      case 'shutter':
      case 'switch':
      case 'brazier':
        spawnFixtures(rt, thing, index, out);
        break;
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
