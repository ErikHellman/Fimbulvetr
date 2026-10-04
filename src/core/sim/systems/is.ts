import { createEntity, mem, setAnim, type Entity } from '../../actors/entity';
import { moveVector, type InputFrame } from '../../input/actions';
import { at, overlaps } from '../../math/box';
import { DIR_VEC } from '../../math/dir';
import { normalize, type Vec } from '../../math/vec';
import { LOW, SOLID } from '../../world/collision';
import { TILE } from '../../world/dims';
import type { SimRt } from '../rt';
import { stampCollision } from './fixtures';
import { enemyDef } from './movement';

/** The bolt's box around its ground point; it is drawn `FLY_Z` px up, at hand height. */
const BOX = { x: -5, y: -10, w: 10, h: 10 } as const;
const FLY_Z = 8;

/** Sings Ís: a bolt of frost the way Ask steers (eight ways) or faces. The wind does not turn it. */
export function castIs(rt: SimRt, input: InputFrame): void {
  const m = moveVector(input);
  const d = m.x !== 0 || m.y !== 0 ? normalize(m) : DIR_VEC[rt.hero.facing];
  const e = createEntity({
    id: rt.newId(),
    kind: 'projectile',
    def: 'is',
    art: 'fx_is',
    pos: { x: rt.hero.pos.x + d.x * 10, y: rt.hero.pos.y + d.y * 10 },
    facing: rt.hero.facing,
    body: BOX,
    hurt: BOX,
    faction: 'hero',
    hp: 1,
    maxHp: 1,
    state: 'fly',
  });
  setAnim(e, 'fly');
  e.mem['dx'] = d.x;
  e.mem['dy'] = d.y;
  e.mem['z'] = FLY_Z;
  rt.actors.push(e);
  rt.emit({ t: 'sfx', id: 'sfx_is' });
}

/** A tile that stops frost in flight: solid and not open above (water lets it pass). */
function wallAt(rt: SimRt, p: Vec): boolean {
  const g = rt.screen.collision;
  const tx = Math.floor(p.x / TILE);
  const ty = Math.floor(p.y / TILE);
  if (tx < 0 || ty < 0 || tx >= g.cols || ty >= g.rows) return true;
  const f = g.flags[ty * g.cols + tx] ?? 0;
  return (f & SOLID) !== 0 && (f & LOW) === 0;
}

/** Gone in a puff of rime. */
function burst(rt: SimRt, e: Entity): void {
  rt.actors = rt.actors.filter((a) => a !== e);
}

/** Open still water with nothing standing on it: the only water frost can floor over. */
function stillWater(rt: SimRt, i: number): boolean {
  const g = rt.screen.cover;
  return rt.terrainOf(rt.screen.id).cells[i] === 'water' && ((g.kind[i] ?? 0) === 0 || g.cleared[i] === 1);
}

/**
 * Lays Ís ice (`is_ice`, walkable) on the still water in the 3×3 tiles around a tile. Running water,
 * black water and fords never freeze. The ice is not saved: it thaws when Ask leaves the screen.
 * Returns whether any water froze.
 */
export function freezeAround(rt: SimRt, tx: number, ty: number): boolean {
  const g = rt.screen.cover;
  const kind = rt.db.coverOrder.indexOf('is_ice') + 1;
  let froze = false;
  for (let y = ty - 1; y <= ty + 1; y++)
    for (let x = tx - 1; x <= tx + 1; x++) {
      if (x < 0 || y < 0 || x >= g.cols || y >= g.rows) continue;
      const i = y * g.cols + x;
      if (!stillWater(rt, i)) continue;
      g.kind[i] = kind;
      g.cleared[i] = 0;
      froze = true;
    }
  if (!froze) return false;
  stampCollision(rt);
  rt.emit({ t: 'coverChanged', screen: rt.screen.id });
  return true;
}

/**
 * Freezes a foe where it stands for `Tuning.is.freeze` ticks: it neither moves nor strikes, and the next
 * blow shatters the ice for double damage. Bosses shake it off.
 */
export function freezeFoe(rt: SimRt, foe: Entity): boolean {
  if (enemyDef(rt, foe).boss !== undefined) {
    rt.emit({ t: 'sfx', id: 'sfx_block' });
    return false;
  }
  foe.mem['frozen'] = rt.db.tuning.is.freeze;
  foe.vel = { x: 0, y: 0 };
  foe.knock = { x: 0, y: 0 };
  rt.emit({ t: 'sfx', id: 'sfx_is' });
  return true;
}

/**
 * An Ís bolt in flight: straight on until its range runs out or it meets a wall. The first foe it
 * touches freezes, and the first still water it crosses ices over; either ends it.
 */
export function stepIs(rt: SimRt, e: Entity): void {
  const t = rt.db.tuning.is;
  const step = { x: mem(e, 'dx') * t.speed, y: mem(e, 'dy') * t.speed };
  const next = { x: e.pos.x + step.x, y: e.pos.y + step.y - 5 };
  if (wallAt(rt, next) || mem(e, 'flown') + t.speed > t.range) {
    burst(rt, e);
    return;
  }
  e.mem['flown'] = mem(e, 'flown') + t.speed;
  e.pos = { x: e.pos.x + step.x, y: e.pos.y + step.y };
  e.fsm.t += 1;
  const box = at(e.body, e.pos);
  const foe = rt.actors.find(
    (a) => a.kind === 'enemy' && mem(a, 'asleep') !== 1 && overlaps(box, at(a.hurt, a.pos)),
  );
  if (foe !== undefined) {
    freezeFoe(rt, foe);
    burst(rt, e);
    return;
  }
  const g = rt.screen.cover;
  const tx = Math.floor(e.pos.x / TILE);
  const ty = Math.floor((e.pos.y - 1) / TILE);
  if (tx >= 0 && ty >= 0 && tx < g.cols && ty < g.rows && stillWater(rt, ty * g.cols + tx)) {
    freezeAround(rt, tx, ty);
    burst(rt, e);
  }
}
