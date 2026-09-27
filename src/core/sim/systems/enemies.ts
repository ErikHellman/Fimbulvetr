import type { Dir4 } from '../../math/dir';
import type { Vec } from '../../math/vec';
import { mem } from '../../actors/entity';
import { BEHAVIOURS, createEnemy } from '../../actors/enemies';
import type { ActorCtx } from '../../actors/enemies/defs';
import { runFsm } from '../../actors/fsm';
import { gridSolidAt } from '../../world/collision';
import type { SimRt } from '../rt';
import { enemyDef } from './movement';

/** What enemy (and critter) behaviours see this tick. */
export function actorCtx(rt: SimRt): ActorCtx {
  return {
    tuning: rt.db.tuning,
    rng: rt.state.rng,
    hero: rt.hero.pos,
    heroVel: rt.hero.vel,
    heroFsm: rt.hero.fsm.s,
    heroFacing: rt.hero.facing,
    solidAt: gridSolidAt(rt.screen.collision, () => true),
    others: rt.actors,
    emit: (ev) => {
      rt.emit(ev);
    },
    spawn: (id, pos: Vec, facing: Dir4) => {
      const e = createEnemy(rt.newId(), rt.db.enemies[id], pos);
      e.facing = facing;
      e.mem['summoned'] = 1;
      rt.actors.push(e);
      return e;
    },
  };
}

/** Runs every enemy's behaviour. Stunned enemies stand still; enemies that marked themselves gone leave. */
export function runEnemies(rt: SimRt, ctx: ActorCtx): void {
  for (const e of [...rt.actors]) {
    if (e.kind !== 'enemy') continue;
    const stun = mem(e, 'stun');
    if (stun > 0) {
      e.mem['stun'] = stun - 1;
      e.vel = { x: 0, y: 0 };
      continue;
    }
    runFsm(BEHAVIOURS[enemyDef(rt, e).behaviour], e, ctx);
  }
  if (rt.actors.some((e) => e.kind === 'enemy' && mem(e, 'gone') === 1))
    rt.actors = rt.actors.filter((e) => e.kind !== 'enemy' || mem(e, 'gone') !== 1);
}
