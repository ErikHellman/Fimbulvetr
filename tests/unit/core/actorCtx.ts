import { TUNING } from '@content/tuning';
import { createEnemy } from '@core/actors/enemies';
import type { ActorCtx } from '@core/actors/enemies/defs';
import type { Entity } from '@core/actors/entity';
import { DB } from '@content/index';
import { createRng } from '@core/math/rng';
import type { SimEvent } from '@core/sim/events';

/** A behaviour context for unit tests: an open field, the hero at the origin, summons collected. */
export function testCtx(over: Partial<ActorCtx> = {}): ActorCtx & {
  readonly events: SimEvent[];
  readonly spawned: Entity[];
} {
  const events: SimEvent[] = [];
  const spawned: Entity[] = [];
  let next = 1000;
  return {
    tuning: TUNING,
    rng: createRng(1),
    hero: { x: 0, y: 0 },
    heroVel: { x: 0, y: 0 },
    heroFsm: 'move',
    heroFacing: 's',
    solidAt: () => false,
    others: [],
    emit: (e) => {
      events.push(e);
    },
    spawn: (id, pos, facing) => {
      const e = createEnemy(next++, DB.enemies[id], pos);
      e.facing = facing;
      e.mem['summoned'] = 1;
      spawned.push(e);
      return e;
    },
    events,
    spawned,
    ...over,
  };
}
