import type { PropId } from '@content/ids';
import { mem, type Entity } from '../../actors/entity';
import { changeState } from '../../actors/fsm';
import { HERO_MACHINE, heroSwordBox } from '../../actors/hero';
import type { PropDef } from '../../actors/prop';
import { THROWN, resolveHit } from '../../combat/hit';
import { EMPTY_FRAME, moveVector, wasPressed, type InputFrame } from '../../input/actions';
import { at, overlaps } from '../../math/box';
import { DIR_VEC } from '../../math/dir';
import { boxHitsSolid, gridSolidAt, moveBox } from '../../world/collision';
import { TILE } from '../../world/dims';
import type { SimRt } from '../rt';
import { heroCtx } from './hero';
import { applyAll, probeBox } from './story';

export const propDef = (rt: SimRt, e: Entity): PropDef => rt.db.props[e.def as PropId];
const isCarried = (e: Entity): boolean => mem(e, 'carried') === 1;
const isThrown = (e: Entity): boolean => mem(e, 'thrown') === 1;

/** A prop lying on the ground (not carried, not in flight). */
export const isResting = (e: Entity): boolean => e.kind === 'prop' && !isCarried(e) && !isThrown(e);

function remove(rt: SimRt, e: Entity): void {
  rt.actors = rt.actors.filter((a) => a !== e);
  if (rt.hero.mem['carrying'] === e.id) rt.hero.mem['carrying'] = 0;
}

function breakProp(rt: SimRt, e: Entity): void {
  const thing = rt.db.screens[rt.screen.id].things[mem(e, 'thing')];
  remove(rt, e);
  rt.emit({ t: 'sfx', id: 'sfx_break' });
  if (thing?.k === 'prop') applyAll(rt, thing.onBreak ?? []);
}

/** Interact in front of a liftable prop: lift it. */
export function tryLift(rt: SimRt): boolean {
  const probe = probeBox(rt);
  const prop = rt.actors.find(
    (a) => isResting(a) && propDef(rt, a).liftable && overlaps(probe, at(a.body, a.pos)),
  );
  if (prop === undefined) return false;
  prop.mem['carried'] = 1;
  rt.hero.mem['carrying'] = prop.id;
  changeState(HERO_MACHINE, rt.hero, 'lift', heroCtx(rt, EMPTY_FRAME));
  rt.emit({ t: 'sfx', id: 'sfx_lift' });
  return true;
}

/** Carried props ride overhead; interact throws (while moving) or sets down (standing); throws fly. */
export function stepProps(rt: SimRt, input: InputFrame): void {
  const hero = rt.hero;
  for (const e of [...rt.actors]) {
    if (e.kind !== 'prop') continue;
    if (isCarried(e)) carried(rt, e, input);
    else if (isThrown(e)) flying(rt, e);
  }
  if (mem(hero, 'carrying') !== 0 && !rt.actors.some((a) => a.id === mem(hero, 'carrying')))
    hero.mem['carrying'] = 0;
}

function carried(rt: SimRt, e: Entity, input: InputFrame): void {
  const hero = rt.hero;
  const state = hero.fsm.s;
  if (state !== 'lift' && state !== 'carry') {
    // Dropped (hurt, or knocked out of the carry): it falls and is lost.
    breakProp(rt, e);
    return;
  }
  const h = rt.db.tuning.hero;
  const p = state === 'lift' ? Math.min(1, (hero.fsm.t + 1) / h.liftTicks) : 1;
  e.pos = { x: hero.pos.x, y: hero.pos.y + 1 };
  e.mem['z'] = h.carryHeight * p;
  if (state !== 'carry' || !wasPressed(input, 'interact')) return;
  const m = moveVector(input);
  if (m.x !== 0 || m.y !== 0) throwProp(rt, e);
  else setDown(rt, e);
}

function throwProp(rt: SimRt, e: Entity): void {
  const d = DIR_VEC[rt.hero.facing];
  e.mem['carried'] = 0;
  e.mem['thrown'] = 1;
  e.mem['ft'] = 0;
  e.mem['tdx'] = d.x;
  e.mem['tdy'] = d.y;
  e.pos = { x: rt.hero.pos.x + d.x * 4, y: rt.hero.pos.y + d.y * 4 + 1 };
  rt.hero.mem['carrying'] = 0;
  changeState(HERO_MACHINE, rt.hero, 'throw', heroCtx(rt, EMPTY_FRAME));
  rt.emit({ t: 'sfx', id: 'sfx_throw' });
}

function setDown(rt: SimRt, e: Entity): void {
  const d = DIR_VEC[rt.hero.facing];
  const pos = { x: rt.hero.pos.x + d.x * TILE, y: rt.hero.pos.y + d.y * TILE };
  const walls = gridSolidAt(rt.screen.collision, () => true);
  const others = rt.actors
    .filter((a) => a !== e && (isResting(a) || a.kind === 'npc' || a.kind === 'enemy'))
    .map((a) => at(a.body, a.pos));
  const box = at(e.body, pos);
  if (boxHitsSolid(box, walls, [...others, at(rt.hero.body, rt.hero.pos)])) return;
  e.pos = pos;
  e.mem['carried'] = 0;
  e.mem['z'] = 0;
  rt.hero.mem['carrying'] = 0;
  changeState(HERO_MACHINE, rt.hero, 'throw', heroCtx(rt, EMPTY_FRAME));
  settle(rt, e);
}

function flying(rt: SimRt, e: Entity): void {
  const tw = rt.db.tuning.throw;
  const t = mem(e, 'ft') + 1;
  e.mem['ft'] = t;
  const d = { x: mem(e, 'tdx'), y: mem(e, 'tdy') };
  const box = at(e.body, e.pos);
  const walls = gridSolidAt(rt.screen.collision, () => true);
  const r = moveBox(box, d.x * tw.speed, d.y * tw.speed, walls, [], 0);
  e.pos = { x: e.pos.x + (r.x - box.x), y: e.pos.y + (r.y - box.y) };
  e.mem['z'] = rt.db.tuning.hero.carryHeight * Math.max(0, 1 - t / tw.flightTicks);
  const def = propDef(rt, e);
  const target = rt.actors.find(
    (a) => (a.kind === 'enemy' || a.kind === 'critter') && overlaps(at(e.hurt, e.pos), at(a.hurt, a.pos)),
  );
  if (target !== undefined) {
    const res = resolveHit(
      target,
      { amount: def.throwDamage, element: 'none', knock: 3, dir: d, faction: 'hero', tags: THROWN },
      { shielding: false, iframes: rt.db.tuning.enemyIframes, knockResist: 0 },
    );
    if (res.outcome !== 'ignored') {
      rt.emit({ t: 'hit', target: target.id, blocked: false, dealt: res.dealt });
      target.mem['hitBy'] = THROWN;
    }
  }
  if (target !== undefined || r.blockedX || r.blockedY || t >= tw.flightTicks) land(rt, e);
}

function land(rt: SimRt, e: Entity): void {
  e.mem['thrown'] = 0;
  e.mem['z'] = 0;
  if (propDef(rt, e).fragile) breakProp(rt, e);
  else settle(rt, e);
}

/** A prop came to rest: a drop zone that accepts it uses it up. */
function settle(rt: SimRt, e: Entity): void {
  const tx = Math.floor(e.pos.x / TILE);
  const ty = Math.floor((e.pos.y - 1) / TILE);
  for (const thing of rt.db.screens[rt.screen.id].things) {
    if (thing.k !== 'drop' || thing.accepts !== e.def) continue;
    if (tx < thing.at.x || tx >= thing.at.x + thing.w || ty < thing.at.y || ty >= thing.at.y + thing.h)
      continue;
    remove(rt, e);
    applyAll(rt, thing.do);
    rt.emit({ t: 'sfx', id: 'sfx_itemget' });
    return;
  }
}

/** Sword swings split logs (a big log only by the spin). */
export function swordProps(rt: SimRt): void {
  const box = heroSwordBox(rt.hero, rt.db.tuning);
  if (box === null) return;
  const swing = mem(rt.hero, 'swing');
  const spinning = mem(rt.hero, 'spinOn') === 1;
  for (const e of [...rt.actors]) {
    if (!isResting(e)) continue;
    const by = propDef(rt, e).breakBy;
    if (by === undefined || mem(e, 'hitSwing') === swing || !overlaps(box, at(e.hurt, e.pos))) continue;
    e.mem['hitSwing'] = swing;
    if (by === 'sword' || spinning) breakProp(rt, e);
    else rt.emit({ t: 'sfx', id: 'sfx_block' });
  }
}
