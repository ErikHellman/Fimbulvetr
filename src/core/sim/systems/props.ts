import type { PropId } from '@content/ids';
import { mem, type Entity } from '../../actors/entity';
import { changeState } from '../../actors/fsm';
import { HERO_MACHINE, heroSwordBox } from '../../actors/hero';
import type { PropDef } from '../../actors/prop';
import { THROWN } from '../../combat/hit';
import { EMPTY_FRAME, moveVector, wasPressed, type InputFrame } from '../../input/actions';
import { at, overlaps } from '../../math/box';
import { DIR_VEC } from '../../math/dir';
import { SOLID, boxHitsSolid, gridSolidAt, moveBox } from '../../world/collision';
import { TILE } from '../../world/dims';
import { tileFeet } from '../../world/screen';
import type { SimRt } from '../rt';
import { damageActor } from './combat';
import { critterDef } from './critters';
import { stampCollision } from './fixtures';
import { heroCtx } from './hero';
import { createDrop } from './pickups';
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

/** Where loot lands around a broken prop, in px (up to eight pieces). */
const LOOT_SPREAD: readonly { x: number; y: number }[] = [
  { x: -12, y: 0 },
  { x: 12, y: 0 },
  { x: 0, y: 10 },
  { x: -8, y: 12 },
  { x: 8, y: 12 },
  { x: 0, y: -2 },
  { x: -16, y: 8 },
  { x: 16, y: 8 },
];

function breakProp(rt: SimRt, e: Entity): void {
  const thing = rt.db.screens[rt.screen.id].things[mem(e, 'thing')];
  const def = propDef(rt, e);
  remove(rt, e);
  if (def.wall === true) stampCollision(rt);
  rt.emit({ t: 'sfx', id: 'sfx_break' });
  (def.loot ?? []).forEach((kind, i) => {
    const d = LOOT_SPREAD[i % LOOT_SPREAD.length] ?? { x: 0, y: 0 };
    rt.actors.push(createDrop(rt.newId(), kind, { x: e.pos.x + d.x, y: e.pos.y + d.y }));
  });
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
    (a) =>
      (a.kind === 'enemy' || (a.kind === 'critter' && critterDef(rt, a).scaredByThrow)) &&
      overlaps(at(e.hurt, e.pos), at(a.hurt, a.pos)),
  );
  if (target !== undefined) {
    const res = damageActor(rt, target, {
      amount: def.throwDamage,
      element: 'none',
      knock: 3,
      dir: d,
      faction: 'hero',
      tags: THROWN,
    });
    if (res.outcome !== 'ignored') target.mem['hitBy'] = THROWN;
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
  const box = heroSwordBox(rt.hero, rt.db.tuning, rt.state.inv.weapon);
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

const tileOf = (e: Entity): { x: number; y: number } => ({
  x: Math.floor(e.pos.x / TILE),
  y: Math.floor((e.pos.y - 1) / TILE),
});

/** The tiles a wall prop fills: its own, and while sliding the one it is sliding into. */
export function wallTiles(rt: SimRt): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (const e of rt.actors) {
    if (!isResting(e) || propDef(rt, e).wall !== true) continue;
    if (mem(e, 'slide') > 0)
      out.push({ x: mem(e, 'fx'), y: mem(e, 'fy') }, { x: mem(e, 'tx'), y: mem(e, 'ty') });
    else out.push(tileOf(e));
  }
  return out;
}

/** Whether a block can slide into tile (x, y): on screen, not solid, and nobody standing there. */
function freeTile(rt: SimRt, x: number, y: number): boolean {
  const g = rt.screen.collision;
  if (x < 0 || y < 0 || x >= g.cols || y >= g.rows) return false;
  if (((g.flags[y * g.cols + x] ?? 0) & SOLID) !== 0) return false;
  const box = { x: x * TILE, y: y * TILE, w: TILE, h: TILE };
  return ![rt.hero, ...rt.actors].some(
    (a) => a.kind !== 'fixture' && a.kind !== 'pickup' && overlaps(box, at(a.body, a.pos)),
  );
}

/**
 * Leaning on a pushable block: `push` counts steady ticks of walking straight into it (the hero shows the
 * push pose meanwhile); at `push.ticks` the block slides a tile if the tile beyond is free.
 */
export function pushBlocks(rt: SimRt, input: InputFrame): void {
  const hero = rt.hero;
  slideBlocks(rt);
  let push = 0;
  const m = moveVector(input);
  const d = DIR_VEC[hero.facing];
  if (
    hero.fsm.s === 'move' &&
    (m.x === 0) !== (m.y === 0) &&
    Math.sign(m.x) === d.x &&
    Math.sign(m.y) === d.y
  ) {
    const probe = probeBox(rt);
    const block = rt.actors.find(
      (a) => isResting(a) && propDef(rt, a).pushable === true && overlaps(probe, at(a.body, a.pos)),
    );
    if (block !== undefined) {
      push = mem(block, 'slide') > 0 ? 1 : mem(hero, 'push') + 1;
      if (push >= rt.db.tuning.push.ticks) {
        startSlide(rt, block, d);
        push = 1;
      }
    }
  }
  if (push !== mem(hero, 'push')) hero.mem['push'] = push;
}

function startSlide(rt: SimRt, e: Entity, d: { x: number; y: number }): void {
  const from = tileOf(e);
  const to = { x: from.x + d.x, y: from.y + d.y };
  if (!freeTile(rt, to.x, to.y)) return;
  e.mem['slide'] = rt.db.tuning.push.slideTicks;
  e.mem['fx'] = from.x;
  e.mem['fy'] = from.y;
  e.mem['tx'] = to.x;
  e.mem['ty'] = to.y;
  rt.emit({ t: 'sfx', id: 'sfx_push' });
  stampCollision(rt);
}

/** Sliding blocks move a step; one that arrives snaps to its tile and counts as moved. */
function slideBlocks(rt: SimRt): void {
  const ticks = rt.db.tuning.push.slideTicks;
  for (const e of rt.actors) {
    const left = mem(e, 'slide');
    if (e.kind !== 'prop' || left <= 0) continue;
    const to = { x: mem(e, 'tx'), y: mem(e, 'ty') };
    const from = tileFeet({ x: mem(e, 'fx'), y: mem(e, 'fy') });
    const end = tileFeet(to);
    const p = (ticks - left + 1) / ticks;
    e.pos = { x: from.x + (end.x - from.x) * p, y: from.y + (end.y - from.y) * p };
    e.mem['slide'] = left - 1;
    if (left - 1 > 0) continue;
    e.pos = end;
    e.mem['moved'] = 1;
    stampCollision(rt);
  }
}
