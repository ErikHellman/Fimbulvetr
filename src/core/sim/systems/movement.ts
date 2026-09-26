import type { EnemyId } from '@content/ids';
import type { EnemyDef } from '../../actors/enemies/defs';
import type { Entity } from '../../actors/entity';
import { at, type Box } from '../../math/box';
import type { Dir4 } from '../../math/dir';
import { length, scale } from '../../math/vec';
import { gridSolidAt, moveBox, type SolidAt } from '../../world/collision';
import type { SimRt } from '../rt';

const KNOCK_EPSILON = 0.1;

export const enemyDef = (rt: SimRt, e: Entity): EnemyDef => rt.db.enemies[e.def as EnemyId];

export function moveAll(rt: SimRt): void {
  const obstacles = rt.actors.filter((e) => enemyDef(rt, e).solid).map((e) => at(e.body, e.pos));
  moveEntity(rt, rt.hero, heroSolidAt(rt), obstacles);
  const walls = gridSolidAt(rt.screen.collision, () => true);
  for (const e of rt.actors) moveEntity(rt, e, walls, []);
}

function moveEntity(rt: SimRt, e: Entity, solidAt: SolidAt, obstacles: readonly Box[]): void {
  const dx = e.vel.x + e.knock.x;
  const dy = e.vel.y + e.knock.y;
  if (dx !== 0 || dy !== 0) {
    const box = at(e.body, e.pos);
    const r = moveBox(box, dx, dy, solidAt, obstacles);
    e.pos = { x: e.pos.x + (r.x - box.x), y: e.pos.y + (r.y - box.y) };
  }
  e.knock = scale(e.knock, rt.db.tuning.knockDecay);
  if (length(e.knock) < KNOCK_EPSILON) e.knock = { x: 0, y: 0 };
}

/** Off-screen tiles are open where a neighbouring screen exists, solid elsewhere. */
export function heroSolidAt(rt: SimRt): SolidAt {
  const { collision, neighbours } = rt.screen;
  return gridSolidAt(collision, (tx, ty) => {
    const outX: Dir4 | null = tx < 0 ? 'w' : tx >= collision.cols ? 'e' : null;
    const outY: Dir4 | null = ty < 0 ? 'n' : ty >= collision.rows ? 's' : null;
    if (outX !== null && outY !== null) return true;
    const dir = outX ?? outY;
    return dir === null ? false : neighbours[dir] === null;
  });
}
