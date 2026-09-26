import type { Entity } from '../../actors/entity';
import { createEnemy } from '../../actors/enemies';
import { tileFeet } from '../../world/screen';
import type { SimRt } from '../rt';

/** Builds the live actors of the current screen from its things. `Thing` has only `enemy` so far. */
export function spawnActors(rt: SimRt): Entity[] {
  return rt.db.screens[rt.screen.id].things.map((thing) =>
    createEnemy(rt.newId(), rt.db.enemies[thing.id], tileFeet(thing.at)),
  );
}
