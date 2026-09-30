import { createEntity, mem, setAnim, type Entity } from '../../actors/entity';
import { changeState } from '../../actors/fsm';
import type { ShotId } from '../../actors/enemies/defs';
import { HERO_MACHINE, heroSwordBox } from '../../actors/hero';
import { ARROW, STUN } from '../../combat/hit';
import { applyEffect } from '../../story/effects';
import { moveVector, type InputFrame } from '../../input/actions';
import { at, overlaps } from '../../math/box';
import { DIR_VEC, dirFromVec } from '../../math/dir';
import { length, normalize, sub, type Vec } from '../../math/vec';
import { LOW, SOLID } from '../../world/collision';
import { TILE } from '../../world/dims';
import type { SimRt } from '../rt';
import { damageActor, hurtHero } from './combat';
import { blowCover } from './cover';
import { eyeAt, strikeSwitch, strikeWheel } from './fixtures';
import { heroCtx } from './hero';
import { windOf } from './weather';
import { stepEldr } from './eldr';
import { enemyDef } from './movement';

/** The boomerang's box around its ground point; it is drawn `FLY_Z` px up, at hand height. */
const BOX = { x: -5, y: -10, w: 10, h: 10 } as const;
const FLY_Z = 8;
/** Where Ask catches it: a little above the feet. */
const HAND = { x: 0, y: -6 } as const;

const flyingBoomerang = (rt: SimRt): Entity | undefined =>
  rt.actors.find((a) => a.kind === 'projectile' && a.def === 'boomerang');

/**
 * Throws the boomerang the way Ask is steering (eight ways), or facing when standing still. Only one flies
 * at a time. Returns whether it was thrown.
 */
export function throwBoomerang(rt: SimRt, input: InputFrame): boolean {
  if (flyingBoomerang(rt) !== undefined) return false;
  const m = moveVector(input);
  const d = m.x !== 0 || m.y !== 0 ? normalize(m) : DIR_VEC[rt.hero.facing];
  const e = createEntity({
    id: rt.newId(),
    kind: 'projectile',
    def: 'boomerang',
    art: 'fx_boomerang',
    pos: { x: rt.hero.pos.x + d.x * 8, y: rt.hero.pos.y + d.y * 8 },
    facing: rt.hero.facing,
    body: BOX,
    hurt: BOX,
    faction: 'hero',
    hp: 1,
    maxHp: 1,
    state: 'out',
  });
  setAnim(e, 'spin');
  e.mem['dx'] = d.x;
  e.mem['dy'] = d.y;
  e.mem['z'] = FLY_Z;
  rt.actors.push(e);
  changeState(HERO_MACHINE, rt.hero, 'toss', heroCtx(rt, input));
  rt.emit({ t: 'sfx', id: 'sfx_boomerang' });
  return true;
}

/** Whether a point is inside a tile that stops things in flight (solid, and not open above). */
function wallAt(rt: SimRt, p: Vec): boolean {
  const g = rt.screen.collision;
  const tx = Math.floor(p.x / TILE);
  const ty = Math.floor(p.y / TILE);
  if (tx < 0 || ty < 0 || tx >= g.cols || ty >= g.rows) return true;
  const f = g.flags[ty * g.cols + tx] ?? 0;
  return (f & SOLID) !== 0 && (f & LOW) === 0;
}

/** Moves everything in flight, each by its own rules. The wind is read once per tick. */
export function stepProjectiles(rt: SimRt): void {
  const flying = rt.actors.filter((a) => a.kind === 'projectile');
  if (flying.length === 0) return;
  const wind = windOf(rt);
  for (const e of flying) {
    if (e.def === 'boomerang') stepBoomerang(rt, e, wind);
    else if (e.def === 'eldr') stepEldr(rt, e, wind);
    else if (e.def === 'spit') stepSpit(rt, e);
    else if (e.def === 'arrow') stepArrow(rt, e);
  }
}

/** An arrow's box around its ground point; it is drawn `ARROW_Z` px up, at bow height. */
const ARROW_BOX = { x: -3, y: -6, w: 6, h: 6 } as const;
const ARROW_Z = 10;

/**
 * The bow's item key: looses an arrow the way Ask faces (four ways), one from the quiver; with none it
 * clicks empty. Returns whether one flew.
 */
export function shootArrow(rt: SimRt, input: InputFrame): boolean {
  if ((rt.state.inv.items.arrows ?? 0) < 1) {
    rt.emit({ t: 'sfx', id: 'sfx_fizzle' });
    return false;
  }
  const d = DIR_VEC[rt.hero.facing];
  const e = createEntity({
    id: rt.newId(),
    kind: 'projectile',
    def: 'arrow',
    art: 'fx_arrow',
    pos: { x: rt.hero.pos.x + d.x * 10, y: rt.hero.pos.y + d.y * 10 },
    facing: rt.hero.facing,
    body: ARROW_BOX,
    hurt: ARROW_BOX,
    faction: 'hero',
    hp: 1,
    maxHp: 1,
    state: 'fly',
  });
  setAnim(e, 'fly');
  e.mem['z'] = ARROW_Z;
  rt.actors.push(e);
  applyEffect({ k: 'take', item: 'arrows' }, rt);
  changeState(HERO_MACHINE, rt.hero, 'shoot', heroCtx(rt, input));
  rt.emit({ t: 'sfx', id: 'sfx_bow' });
  return true;
}

/**
 * An arrow flies straight over water, pits and low ground until it meets a wall or runs out, strikes the
 * first foe it touches (the `ARROW` tag: a crown's gem knows it), or lights a switch (eyes too).
 */
function stepArrow(rt: SimRt, e: Entity): void {
  const a = rt.db.tuning.bow;
  const gone = (): void => {
    rt.actors = rt.actors.filter((x) => x !== e);
  };
  const d = DIR_VEC[e.facing];
  const next = { x: e.pos.x + d.x * a.speed, y: e.pos.y + d.y * a.speed };
  // A switch stands solid on its tile: the arrow strikes it before the wall check would stop it.
  if (strikeSwitch(rt, at(e.body, next), true)) {
    gone();
    return;
  }
  if (e.fsm.t >= a.life || wallAt(rt, { x: next.x, y: next.y - 3 })) {
    gone();
    return;
  }
  e.pos = next;
  e.fsm.t += 1;
  const box = at(e.body, e.pos);
  const foe = rt.actors.find(
    (x) => x.kind === 'enemy' && overlaps(box, at(x.hurt, x.pos)) && x.iframes === 0,
  );
  if (foe === undefined) return;
  damageActor(rt, foe, { amount: a.damage, element: 'none', knock: 2, dir: d, faction: 'hero', tags: ARROW });
  gone();
}

/** A gob of spit's box around its ground point; it is drawn `SPIT_Z` px up, at head height. */
const SPIT_BOX = { x: -4, y: -8, w: 8, h: 8 } as const;
const SPIT_Z = 10;
/** Spit numbers: px per tick, ticks, and quarter hearts. */
export const SPIT = { speed: 2.5, life: 120, amount: 2, knock: 3 } as const;

/** Looses an enemy's shot from `pos` along `dir`. */
export function shoot(rt: SimRt, def: ShotId, pos: Vec, dir: Vec): void {
  const d = length(dir) === 0 ? { x: 0, y: 1 } : normalize(dir);
  const e = createEntity({
    id: rt.newId(),
    kind: 'projectile',
    def,
    art: 'fx_spit',
    pos: { ...pos },
    facing: dirFromVec(d, 's'),
    body: SPIT_BOX,
    hurt: SPIT_BOX,
    faction: 'enemy',
    hp: 1,
    maxHp: 1,
    state: 'fly',
  });
  setAnim(e, 'fly');
  e.mem['dx'] = d.x;
  e.mem['dy'] = d.y;
  e.mem['z'] = SPIT_Z;
  rt.actors.push(e);
  rt.emit({ t: 'sfx', id: 'sfx_spit' });
}

/**
 * A gob of spit flies straight over water and low ground until it meets a wall, runs out, is struck
 * away by the sword, or hits Ask (the shield stops it from the front).
 */
function stepSpit(rt: SimRt, e: Entity): void {
  const gone = (): void => {
    rt.actors = rt.actors.filter((a) => a !== e);
  };
  const next = { x: e.pos.x + mem(e, 'dx') * SPIT.speed, y: e.pos.y + mem(e, 'dy') * SPIT.speed };
  if (e.fsm.t >= SPIT.life || wallAt(rt, { x: next.x, y: next.y - 4 })) {
    gone();
    return;
  }
  e.pos = next;
  e.fsm.t += 1;
  const box = at(e.body, e.pos);
  const sword = heroSwordBox(rt.hero, rt.db.tuning, rt.state.inv.weapon);
  if (sword !== null && overlaps(sword, box)) {
    rt.emit({ t: 'sfx', id: 'sfx_block' });
    gone();
    return;
  }
  if (!overlaps(box, at(rt.hero.hurt, rt.hero.pos))) return;
  if (hurtHero(rt, e, SPIT.amount, SPIT.knock, 0)) gone();
}

/**
 * A boomerang in flight: out along its line (the wind pushing it aside) until the range runs out or it
 * meets a wall, an enemy, a switch or a pickup, then back to Ask's hand through anything. On the way it
 * stuns what it strikes, lights switches, blows leaves away and brings back what it caught.
 */
function stepBoomerang(rt: SimRt, e: Entity, wind: Vec): void {
  const b = rt.db.tuning.boomerang;
  const back = e.fsm.s === 'back';
  let step: Vec;
  if (back) {
    const hand = { x: rt.hero.pos.x + HAND.x, y: rt.hero.pos.y + HAND.y };
    const to = sub(hand, e.pos);
    if (length(to) <= b.speed + 2) {
      catchBoomerang(rt, e);
      return;
    }
    const n = normalize(to);
    step = { x: n.x * b.speed, y: n.y * b.speed };
  } else {
    step = { x: mem(e, 'dx') * b.speed + wind.x, y: mem(e, 'dy') * b.speed + wind.y };
    const next = { x: e.pos.x + step.x, y: e.pos.y + step.y - 5 };
    if (wallAt(rt, next) || mem(e, 'flown') + b.speed > b.range) {
      turnBack(e);
      return;
    }
    e.mem['flown'] = mem(e, 'flown') + b.speed;
  }
  e.pos = { x: e.pos.x + step.x, y: e.pos.y + step.y };
  e.fsm.t += 1;
  strike(rt, e, back);
  carry(rt, e);
}

function turnBack(e: Entity): void {
  e.fsm = { s: 'back', t: 0 };
}

/** What the boomerang touches this tick. On the way out, any of it turns it back. */
function strike(rt: SimRt, e: Entity, back: boolean): void {
  const box = at(e.body, e.pos);
  blowCover(rt, box);
  let turn = false;
  for (const a of [...rt.actors]) {
    if (a.kind !== 'enemy' || a.id === mem(e, 'hit') || !overlaps(box, at(a.hurt, a.pos))) continue;
    e.mem['hit'] = a.id;
    const d = normalize(sub(a.pos, e.pos));
    damageActor(rt, a, { amount: 0, element: 'none', knock: 0, dir: d, faction: 'hero', tags: STUN });
    rt.emit({ t: 'sfx', id: enemyDef(rt, a).stunnable === undefined ? 'sfx_block' : 'sfx_stun' });
    turn = true;
  }
  if (strikeSwitch(rt, box) || strikeWheel(rt, box)) turn = true;
  else if (!back && eyeAt(rt, box)) {
    rt.emit({ t: 'sfx', id: 'sfx_block' });
    turn = true;
  }
  if (mem(e, 'fetch') === 0) {
    const pickup = rt.actors.find(
      (a) => a.kind === 'pickup' && mem(a, 'hidden') !== 1 && overlaps(box, at(a.body, a.pos)),
    );
    if (pickup !== undefined) {
      e.mem['fetch'] = pickup.id;
      turn = true;
    }
  }
  if (turn && !back) turnBack(e);
}

/** A caught pickup rides the boomerang. */
function carry(rt: SimRt, e: Entity): void {
  const id = mem(e, 'fetch');
  if (id === 0) return;
  const p = rt.actors.find((a) => a.id === id);
  if (p === undefined) return;
  p.pos = { ...e.pos };
  p.mem['z'] = FLY_Z;
}

/** Back in hand: whatever it brought is dropped at Ask's feet, where it is picked up at once. */
function catchBoomerang(rt: SimRt, e: Entity): void {
  rt.actors = rt.actors.filter((a) => a !== e);
  const p = rt.actors.find((a) => a.id === mem(e, 'fetch'));
  if (p === undefined) return;
  p.pos = { ...rt.hero.pos };
  p.mem['z'] = 0;
}
