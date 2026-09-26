import type { Entity } from '../../actors/entity';
import { createEnemy } from '../../actors/enemies';
import { tileFeet } from '../../world/screen';
import type { SimRt } from '../rt';

/** Builds the live actors of the current screen from its things. */
export function spawnActors(rt: SimRt): Entity[] {
  const out: Entity[] = [];
  for (const thing of rt.db.screens[rt.screen.id].things) {
    switch (thing.k) {
      case 'enemy':
        out.push(createEnemy(rt.newId(), rt.db.enemies[thing.id], tileFeet(thing.at)));
        break;
      case 'door':
      case 'sign':
      case 'use':
      case 'trigger':
        break;
      default: {
        const never: never = thing;
        throw new Error(`unknown thing ${JSON.stringify(never)}`);
      }
    }
  }
  return out;
}
