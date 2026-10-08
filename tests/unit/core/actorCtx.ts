import { TUNING } from '@content/tuning';
import { createEnemy } from '@core/actors/enemies';
import type { ActorCtx, ShotId } from '@core/actors/enemies/defs';
import type { Vec } from '@core/math/vec';
import type { Entity } from '@core/actors/entity';
import { DB } from '@content/index';
import { createRng } from '@core/math/rng';
import type { SimEvent } from '@core/sim/events';

/** A behaviour context for unit tests: an open field, the hero at the origin, summons collected. */
export function testCtx(over: Partial<ActorCtx> = {}): ActorCtx & {
  readonly events: SimEvent[];
  readonly spawned: Entity[];
  readonly shots: { def: ShotId; pos: Vec; dir: Vec }[];
} {
  const events: SimEvent[] = [];
  const spawned: Entity[] = [];
  const shots: { def: ShotId; pos: Vec; dir: Vec }[] = [];
  let next = 1000;
  return {
    tuning: TUNING,
    rng: createRng(1),
    hero: { x: 0, y: 0 },
    heroVel: { x: 0, y: 0 },
    heroFsm: 'move',
    heroFacing: 's',
    solidAt: () => false,
    waterAt: () => false,
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
    shoot: (def, pos, dir) => {
      shots.push({ def, pos, dir });
    },
    events,
    spawned,
    shots,
    ...over,
  };
}
