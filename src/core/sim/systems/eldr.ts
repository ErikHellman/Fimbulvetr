import { createEntity, mem, setAnim, type Entity } from '../../actors/entity';
import { moveVector, type InputFrame } from '../../input/actions';
import { at, overlaps } from '../../math/box';
import { DIR_VEC } from '../../math/dir';
import { normalize, type Vec } from '../../math/vec';
import { encodeBits } from '../../world/cover';
import { LOW, SOLID } from '../../world/collision';
import { TILE } from '../../world/dims';
import type { SimRt } from '../rt';
import { damageActor } from './combat';
import { ignite } from './fire';
import { lightBrazier, meltGate, stampCollision } from './fixtures';
import { burnProp } from './props';
import { raining } from './weather';

/** The bolt's box around its ground point; it is drawn `FLY_Z` px up, at hand height. */
const BOX = { x: -5, y: -10, w: 10, h: 10 } as const;
const FLY_Z = 8;

/** Sings Eldr: a bolt of fire the way Ask steers (eight ways) or faces. */
export function castEldr(rt: SimRt, input: InputFrame): void {
  const m = moveVector(input);
  const d = m.x !== 0 || m.y !== 0 ? normalize(m) : DIR_VEC[rt.hero.facing];
  const e = createEntity({
    id: rt.newId(),
    kind: 'projectile',
    def: 'eldr',
    art: 'fx_eldr',
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
  rt.emit({ t: 'sfx', id: 'sfx_eldr' });
}

/** A tile that stops fire in flight: solid and not open above (water lets it pass). */
function wallAt(rt: SimRt, p: Vec): boolean {
  const g = rt.screen.collision;
  const tx = Math.floor(p.x / TILE);
  const ty = Math.floor(p.y / TILE);
  if (tx < 0 || ty < 0 || tx >= g.cols || ty >= g.rows) return true;
  const f = g.flags[ty * g.cols + tx] ?? 0;
  return (f & SOLID) !== 0 && (f & LOW) === 0;
}

/** Gone in a burst of sparks. */
function burst(rt: SimRt, e: Entity): void {
  rt.actors = rt.actors.filter((a) => a !== e);
  rt.emit({ t: 'sfx', id: 'sfx_fire' });
}

/**
 * Melts the drifts and ice in the 3×3 tiles around a tile (never under anyone's feet, so nobody ends up
 * inside the water). Returns whether anything melted.
 */
export function meltAround(rt: SimRt, tx: number, ty: number): boolean {
  const g = rt.screen.cover;
  const feet = [rt.hero, ...rt.actors].map((a) => at(a.body, a.pos));
  let melted = false;
  for (let y = ty - 1; y <= ty + 1; y++)
    for (let x = tx - 1; x <= tx + 1; x++) {
      if (x < 0 || y < 0 || x >= g.cols || y >= g.rows) continue;
      const i = y * g.cols + x;
      const id = rt.db.coverOrder[(g.kind[i] ?? 0) - 1];
      if (id === undefined || g.cleared[i] === 1 || rt.db.cover[id].melts !== true) continue;
      const tile = { x: x * TILE, y: y * TILE, w: TILE, h: TILE };
      if (rt.db.cover[id].walk === true && feet.some((f) => overlaps(f, tile))) continue;
      g.cleared[i] = 1;
      melted = true;
    }
  if (!melted) return false;
  rt.state.world.cover[rt.screen.id] = { epoch: g.epoch, cleared: encodeBits(g.cleared) };
  stampCollision(rt);
  rt.emit({ t: 'coverChanged', screen: rt.screen.id });
  return true;
}

/**
 * An Eldr bolt in flight: straight on (the wind pushing it aside) until its range runs out or it meets a
 * wall. Whatever it touches first takes the fire and ends it: a melting gate (its flag set), a foe (burnt, half as hard in the rain), a
 * cold brazier (lit), brambles (burnt away), burnable cover (set alight) or drifts and ice (melted).
 */
export function stepEldr(rt: SimRt, e: Entity, wind: Vec): void {
  const t = rt.db.tuning.eldr;
  const step = { x: mem(e, 'dx') * t.speed + wind.x, y: mem(e, 'dy') * t.speed + wind.y };
  const next = { x: e.pos.x + step.x, y: e.pos.y + step.y - 5 };
  // A melting gate is stamped solid, so it is met before the wall it would otherwise be.
  if (meltGate(rt, at(e.body, { x: e.pos.x + step.x, y: e.pos.y + step.y }))) {
    burst(rt, e);
    return;
  }
  if (wallAt(rt, next) || mem(e, 'flown') + t.speed > t.range) {
    burst(rt, e);
    return;
  }
  e.mem['flown'] = mem(e, 'flown') + t.speed;
  e.pos = { x: e.pos.x + step.x, y: e.pos.y + step.y };
  e.fsm.t += 1;
  const box = at(e.body, e.pos);
  const foe = rt.actors.find((a) => a.kind === 'enemy' && overlaps(box, at(a.hurt, a.pos)));
  if (foe !== undefined) {
    const amount = raining(rt) ? Math.ceil(t.damage / 2) : t.damage;
    damageActor(rt, foe, {
      amount,
      element: 'fire',
      knock: 3,
      dir: normalize(step),
      faction: 'hero',
      tags: 0,
    });
    burst(rt, e);
    return;
  }
  if (lightBrazier(rt, box)) {
    burst(rt, e);
    return;
  }
  const thorns = rt.actors.find((a) => a.kind === 'prop' && overlaps(box, at(a.hurt, a.pos)));
  if (thorns !== undefined && burnProp(rt, thorns)) {
    burst(rt, e);
    return;
  }
  const tx = Math.floor(e.pos.x / TILE);
  const ty = Math.floor((e.pos.y - 1) / TILE);
  if (ignite(rt, tx, ty) || meltAround(rt, tx, ty)) burst(rt, e);
}
