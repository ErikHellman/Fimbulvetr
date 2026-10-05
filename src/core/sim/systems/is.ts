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
import { killEnemy } from './combat';

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
 * black water and fords never freeze, nor does the screen's outer ring. The ice is not saved: it thaws when
 * Ask leaves the screen.
 * Returns whether any water froze.
 */
export function freezeAround(rt: SimRt, tx: number, ty: number): boolean {
  const g = rt.screen.cover;
  const kind = rt.db.coverOrder.indexOf('is_ice') + 1;
  let froze = false;
  for (let y = ty - 1; y <= ty + 1; y++)
    for (let x = tx - 1; x <= tx + 1; x++) {
      // Never the outer ring: ice there would let Ask walk out over a seam onto the next screen's open water.
      if (x < 1 || y < 1 || x >= g.cols - 1 || y >= g.rows - 1) continue;
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

/** How long an Ís crust on lava holds, in ticks (6 s). */
export const IS_CRUST_TICKS = 360;

/** Open lava with no crust on it yet. */
function openLava(rt: SimRt, i: number): boolean {
  const id = rt.terrainOf(rt.screen.id).cells[i];
  return id !== undefined && rt.db.terrain[id].lava === true && (rt.screen.cover.kind[i] ?? 0) === 0;
}

/**
 * Lays a crust (`crust`, walkable) on the lava in the 3×3 tiles around a tile, for `IS_CRUST_TICKS`.
 * Never on the screen's outer ring. Returns whether any lava crusted.
 */
export function crustAround(rt: SimRt, tx: number, ty: number): boolean {
  const g = rt.screen.cover;
  const kind = rt.db.coverOrder.indexOf('crust') + 1;
  let crusted = false;
  for (let y = ty - 1; y <= ty + 1; y++)
    for (let x = tx - 1; x <= tx + 1; x++) {
      if (x < 1 || y < 1 || x >= g.cols - 1 || y >= g.rows - 1) continue;
      const i = y * g.cols + x;
      if (!openLava(rt, i)) continue;
      g.kind[i] = kind;
      g.cleared[i] = 0;
      rt.crust ??= new Map();
      rt.crust.set(i, IS_CRUST_TICKS);
      crusted = true;
    }
  if (!crusted) return false;
  stampCollision(rt);
  rt.emit({ t: 'coverChanged', screen: rt.screen.id });
  rt.emit({ t: 'sfx', id: 'sfx_sizzle' });
  return true;
}

const feetTile = (rt: SimRt, e: Entity): number => {
  const g = rt.screen.cover;
  return Math.floor((e.pos.y - 1) / TILE) * g.cols + Math.floor(e.pos.x / TILE);
};

/**
 * Cools the crust on lava a tick at a time. A crust cools away when its time is up, unless Ask stands on
 * it (it holds until Ask steps off); a walking foe left on it burns.
 */
export function stepCrust(rt: SimRt): void {
  if (rt.crust === undefined) return;
  const under = feetTile(rt, rt.hero);
  const gone: number[] = [];
  for (const [i, t] of rt.crust) {
    if (t > 1) rt.crust.set(i, t - 1);
    else if (i !== under) gone.push(i);
  }
  if (gone.length === 0) return;
  const g = rt.screen.cover;
  for (const i of gone) {
    rt.crust.delete(i);
    g.kind[i] = 0;
  }
  if (rt.crust.size === 0) rt.crust = undefined;
  stampCollision(rt);
  rt.emit({ t: 'coverChanged', screen: rt.screen.id });
  rt.emit({ t: 'sfx', id: 'sfx_sizzle' });
  for (const foe of rt.actors.filter((a) => a.kind === 'enemy' && gone.includes(feetTile(rt, a)))) {
    if (enemyDef(rt, foe).flies === true) continue;
    rt.actors = rt.actors.filter((a) => a !== foe);
    rt.emit({ t: 'sfx', id: 'sfx_fire' });
  }
}

/**
 * Freezes a foe where it stands for `Tuning.is.freeze` ticks: it neither moves nor strikes, and the next
 * blow shatters the ice for double damage. Bosses shake it off; a foe weak to ice is put out.
 */
export function freezeFoe(rt: SimRt, foe: Entity): boolean {
  const def = enemyDef(rt, foe);
  if (def.weak?.includes('ice') === true) {
    // A thing of fire (an ember sprite) is put out at once.
    killEnemy(rt, foe, def);
    rt.emit({ t: 'sfx', id: 'sfx_sizzle' });
    return true;
  }
  if (def.boss !== undefined) {
    // A white-hot boss (Ívaldi's last phase) is cooled for its behaviour to read; others shrug it off.
    if (mem(foe, 'hot') === 1) {
      foe.mem['iced'] = 1;
      rt.emit({ t: 'sfx', id: 'sfx_sizzle' });
      return true;
    }
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
  } else if (tx >= 0 && ty >= 0 && tx < g.cols && ty < g.rows && openLava(rt, ty * g.cols + tx)) {
    crustAround(rt, tx, ty);
    burst(rt, e);
  }
}
