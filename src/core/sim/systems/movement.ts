import type { EnemyId } from '@content/ids';
import type { EnemyDef } from '../../actors/enemies/defs';
import { mem, type Entity } from '../../actors/entity';
import { at, overlaps, type Box } from '../../math/box';
import { DIR_VEC, type Dir4 } from '../../math/dir';
import { length, scale, type Vec } from '../../math/vec';
import { DEEP, gridSolidAt, LOW, moveBox, speedAt, type SolidAt } from '../../world/collision';
import { TILE } from '../../world/dims';
import type { SimRt } from '../rt';
import { coverSpeed } from './cover';
import { critterDef } from './critters';

const KNOCK_EPSILON = 0.1;

export const enemyDef = (rt: SimRt, e: Entity): EnemyDef => rt.db.enemies[e.def as EnemyId];

/** Whether an actor blocks the hero like a wall. */
export function blocksHero(rt: SimRt, e: Entity): boolean {
  if (e.kind === 'npc') return true;
  if (e.kind === 'prop') return mem(e, 'carried') === 0 && mem(e, 'thrown') === 0;
  if (e.kind === 'critter') return critterDef(rt, e).solid;
  return e.kind === 'enemy' && enemyDef(rt, e).solid;
}

export function moveAll(rt: SimRt): void {
  // A solid foe that walked into Ask (a charge, a fetch) never pins Ask: only boxes clear of Ask block.
  const me = at(rt.hero.body, rt.hero.pos);
  const obstacles = rt.actors
    .filter((e) => blocksHero(rt, e))
    .map((e) => at(e.body, e.pos))
    .filter((b) => !overlaps(b, me));
  // Aboard a moving raft, Ask goes where the raft goes (see `stepRafts`).
  if (mem(rt.hero, 'raft') !== 1) {
    const push = currentPush(rt);
    rt.hero.vel = { x: rt.hero.vel.x + push.x, y: rt.hero.vel.y + push.y };
    moveEntity(rt, rt.hero, heroSolidAt(rt), obstacles);
  }
  const walls = gridSolidAt(rt.screen.collision, () => true);
  const { cols, rows } = rt.screen.collision;
  const sky: SolidAt = (tx, ty) => tx < 0 || ty < 0 || tx >= cols || ty >= rows;
  const hero = [at(rt.hero.body, rt.hero.pos)];
  // Swimmers (a nykr foal) cross open deep water as well as ground.
  const swims: SolidAt = (tx, ty) => walls(tx, ty) && !openWater(rt, tx, ty);
  for (const e of rt.actors) {
    const def = e.kind === 'enemy' ? enemyDef(rt, e) : undefined;
    const flies = def?.flies === true;
    moveEntity(rt, e, flies ? sky : def?.swims === true ? swims : walls, e.kind === 'npc' ? hero : [], flies);
  }
}

/**
 * Shoves a foe (or any actor but Ask) `dx`, `dy` px at once, stopped by what stops it walking: walls for
 * walkers, open water staying open for swimmers, the screen's edge for fliers.
 */
export function shove(rt: SimRt, e: Entity, dx: number, dy: number): void {
  const def = e.kind === 'enemy' ? enemyDef(rt, e) : undefined;
  const walls = gridSolidAt(rt.screen.collision, () => true);
  const { cols, rows } = rt.screen.collision;
  const solidAt: SolidAt =
    def?.flies === true
      ? (tx, ty) => tx < 0 || ty < 0 || tx >= cols || ty >= rows
      : def?.swims === true
        ? (tx, ty) => walls(tx, ty) && !openWater(rt, tx, ty)
        : walls;
  const box = at(e.body, e.pos);
  const r = moveBox(box, dx, dy, solidAt, []);
  e.pos = { x: e.pos.x + (r.x - box.x), y: e.pos.y + (r.y - box.y) };
}

function moveEntity(rt: SimRt, e: Entity, solidAt: SolidAt, obstacles: readonly Box[], flies = false): void {
  const f = flies
    ? 1
    : speedAt(rt.screen.collision, e.pos.x, e.pos.y - 1) * coverSpeed(rt, e, e.pos.x, e.pos.y);
  const dx = e.vel.x * f + e.knock.x;
  const dy = e.vel.y * f + e.knock.y;
  if (dx !== 0 || dy !== 0) {
    const box = at(e.body, e.pos);
    const r = moveBox(box, dx, dy, solidAt, obstacles);
    e.pos = { x: e.pos.x + (r.x - box.x), y: e.pos.y + (r.y - box.y) };
  }
  e.knock = scale(e.knock, rt.db.tuning.knockDecay);
  if (length(e.knock) < KNOCK_EPSILON) e.knock = { x: 0, y: 0 };
}

/**
 * Off-screen tiles are open where a neighbouring screen exists, solid elsewhere. With the seal-skin, open
 * deep water (`DEEP` and still `LOW`: no ice, raft or wall on it) is open too.
 */
export function heroSolidAt(rt: SimRt): SolidAt {
  const { collision, neighbours } = rt.screen;
  const solid = gridSolidAt(collision, (tx, ty) => {
    const outX: Dir4 | null = tx < 0 ? 'w' : tx >= collision.cols ? 'e' : null;
    const outY: Dir4 | null = ty < 0 ? 'n' : ty >= collision.rows ? 's' : null;
    if (outX !== null && outY !== null) return true;
    const dir = outX ?? outY;
    return dir === null ? false : neighbours[dir] === null;
  });
  if (!swimmer(rt)) return solid;
  return (tx, ty) => !openWater(rt, tx, ty) && solid(tx, ty);
}

const swimmer = (rt: SimRt): boolean => (rt.state.inv.items.sealskin ?? 0) > 0;

/** Whether a tile is deep water nothing stands on (see `heroSolidAt`). */
export function openWater(rt: SimRt, tx: number, ty: number): boolean {
  const g = rt.screen.collision;
  if (tx < 0 || ty < 0 || tx >= g.cols || ty >= g.rows) return false;
  const f = g.flags[ty * g.cols + tx] ?? 0;
  return (f & DEEP) !== 0 && (f & LOW) !== 0;
}

/** Whether Ask's feet are in open deep water with the seal-skin to swim it. */
export function wet(rt: SimRt): boolean {
  if (!swimmer(rt)) return false;
  return openWater(rt, Math.floor(rt.hero.pos.x / TILE), Math.floor((rt.hero.pos.y - 1) / TILE));
}

/** The push of the current under a swimmer's feet (a diver passes under a surge). */
function currentPush(rt: SimRt): Vec {
  const s = rt.hero.fsm.s;
  if (s !== 'swim' && s !== 'dive') return { x: 0, y: 0 };
  const { terrain } = rt.screen;
  const tx = Math.floor(rt.hero.pos.x / TILE);
  const ty = Math.floor((rt.hero.pos.y - 1) / TILE);
  const id = terrain.cells[ty * terrain.cols + tx];
  const def = id === undefined ? undefined : rt.db.terrain[id];
  if (def?.current === undefined || (def.strong === true && s === 'dive')) return { x: 0, y: 0 };
  const h = rt.db.tuning.hero;
  return scale(DIR_VEC[def.current], def.strong === true ? h.strongCurrent : h.current);
}
