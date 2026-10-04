import { createEntity, mem, setAnim, type Entity } from '../../actors/entity';
import { changeState } from '../../actors/fsm';
import { HERO_MACHINE } from '../../actors/hero';
import { STUN } from '../../combat/hit';
import { EMPTY_FRAME, type InputFrame } from '../../input/actions';
import { at, overlaps, type Box } from '../../math/box';
import { DIR_VEC } from '../../math/dir';
import { length, normalize, sub, type Vec } from '../../math/vec';
import { LOW, SOLID } from '../../world/collision';
import { TILE } from '../../world/dims';
import { tileFeet } from '../../world/screen';
import type { SimRt } from '../rt';
import { damageActor } from './combat';
import { strikeSwitch } from './fixtures';
import { heroCtx } from './hero';
import { enemyDef } from './movement';

/** The chain's head, around its ground point; it is drawn `HEAD_Z` px up, at hand height. */
const HEAD = { x: -4, y: -8, w: 8, h: 8 } as const;
const HEAD_Z = 8;
/** Where the chain leaves Ask's hand. */
const HAND = { x: 0, y: -6 } as const;
/** A dragged foe (stunned from the moment it is hooked) is let go this close to Ask. */
const LET_GO = 24;

const headOf = (rt: SimRt): Entity | undefined =>
  rt.actors.find((a) => a.kind === 'projectile' && a.def === 'grapple');

const handOf = (rt: SimRt): Vec => ({ x: rt.hero.pos.x + HAND.x, y: rt.hero.pos.y + HAND.y });

/**
 * The grapple's item key: the chain's head flies the way Ask faces, and Ask stands with the arm out
 * until it is back (or has pulled Ask to a post). Only one at a time. Returns whether it was thrown.
 */
export function fireGrapple(rt: SimRt, input: InputFrame): boolean {
  if (headOf(rt) !== undefined) return false;
  const d = DIR_VEC[rt.hero.facing];
  const e = createEntity({
    id: rt.newId(),
    kind: 'projectile',
    def: 'grapple',
    art: 'fx_grapple',
    pos: { x: rt.hero.pos.x + d.x * 6, y: rt.hero.pos.y + d.y * 6 },
    facing: rt.hero.facing,
    body: HEAD,
    hurt: HEAD,
    faction: 'hero',
    hp: 1,
    maxHp: 1,
    state: 'out',
  });
  setAnim(e, 'fly');
  e.mem['z'] = HEAD_Z;
  rt.actors.push(e);
  changeState(HERO_MACHINE, rt.hero, 'chain', heroCtx(rt, input));
  rt.emit({ t: 'sfx', id: 'sfx_chain' });
  return true;
}

/** The chain from Ask's hand to its head, for the picture; null when it is not out. */
export function grappleLine(rt: SimRt): { readonly hand: Vec; readonly head: Vec } | null {
  const e = headOf(rt);
  return e === undefined ? null : { hand: handOf(rt), head: { ...e.pos } };
}

/** Whether a point is inside a tile that stops the chain (solid, and not open above). */
function wallAt(rt: SimRt, p: Vec): boolean {
  const g = rt.screen.collision;
  const tx = Math.floor(p.x / TILE);
  const ty = Math.floor(p.y / TILE);
  if (tx < 0 || ty < 0 || tx >= g.cols || ty >= g.rows) return true;
  const f = g.flags[ty * g.cols + tx] ?? 0;
  return (f & SOLID) !== 0 && (f & LOW) === 0;
}

const postAt = (rt: SimRt, box: Box): Entity | undefined =>
  rt.actors.find((a) => a.kind === 'fixture' && a.def === 'post' && overlaps(box, at(a.hurt, a.pos)));

/**
 * The chain in flight. Out: it hooks the first post, foe, pickup or switch on its line, or turns back at a
 * wall or its reach. On a post it pulls Ask along the line to the tile before the post. Back: it reels in
 * to Ask's hand with whatever it caught. Ask struck while it is out drops it.
 */
export function stepGrapple(rt: SimRt, e: Entity): void {
  const g = rt.db.tuning.grapple;
  const gone = (): void => {
    rt.actors = rt.actors.filter((a) => a !== e);
  };
  if (rt.hero.fsm.s !== 'chain') {
    gone();
    return;
  }
  e.fsm.t += 1;
  if (e.fsm.s === 'pull') {
    pull(rt, e, g.pull, gone);
    return;
  }
  if (e.fsm.s === 'back') {
    reel(rt, e, g.speed, gone);
    return;
  }
  const d = DIR_VEC[e.facing];
  const next = { x: e.pos.x + d.x * g.speed, y: e.pos.y + d.y * g.speed };
  const box = at(e.body, next);
  // A post (and a switch) stands solid on its tile: the head meets it before the wall check would.
  const post = postAt(rt, box);
  if (post !== undefined) {
    e.pos = { x: post.pos.x, y: post.pos.y - 6 };
    const tx = mem(post, 'tx') - d.x;
    const ty = mem(post, 'ty') - d.y;
    e.mem['toX'] = tileFeet({ x: tx, y: ty }).x;
    e.mem['toY'] = tileFeet({ x: tx, y: ty }).y;
    e.fsm = { s: 'pull', t: 0 };
    rt.emit({ t: 'sfx', id: 'sfx_block' });
    return;
  }
  if (strikeSwitch(rt, box)) {
    e.fsm = { s: 'back', t: 0 };
    return;
  }
  if (wallAt(rt, { x: next.x, y: next.y - 4 }) || mem(e, 'flown') + g.speed > g.range) {
    e.fsm = { s: 'back', t: 0 };
    return;
  }
  e.mem['flown'] = mem(e, 'flown') + g.speed;
  e.pos = next;
  hook(rt, e, box);
}

/** What the head catches on the way out: a light foe or a pickup rides back with it; a heavy foe is hooked. */
function hook(rt: SimRt, e: Entity, box: Box): void {
  const foe = rt.actors.find(
    (a) => a.kind === 'enemy' && mem(a, 'asleep') !== 1 && overlaps(box, at(a.hurt, a.pos)),
  );
  if (foe !== undefined) {
    if (enemyDef(rt, foe).light === true) {
      e.mem['drag'] = foe.id;
      stun(rt, foe);
    } else {
      foe.mem['hooked'] = 1;
      rt.emit({ t: 'sfx', id: 'sfx_block' });
    }
    e.fsm = { s: 'back', t: 0 };
    return;
  }
  const pickup = rt.actors.find(
    (a) =>
      a.kind === 'pickup' &&
      mem(a, 'hidden') !== 1 &&
      mem(a, 'sunk') !== 1 &&
      overlaps(box, at(a.body, a.pos)),
  );
  if (pickup !== undefined) {
    e.mem['fetch'] = pickup.id;
    e.fsm = { s: 'back', t: 0 };
  }
}

/** Reels the head in to Ask's hand, carrying its catch; a dragged foe is let go close by. */
function reel(rt: SimRt, e: Entity, speed: number, gone: () => void): void {
  const to = sub(handOf(rt), e.pos);
  const done = length(to) <= speed + 2;
  if (!done) {
    const n = normalize(to);
    e.pos = { x: e.pos.x + n.x * speed, y: e.pos.y + n.y * speed };
  }
  const fetched = rt.actors.find((a) => a.id === mem(e, 'fetch'));
  if (fetched !== undefined) {
    fetched.pos = done ? { ...rt.hero.pos } : { ...e.pos };
    fetched.mem['z'] = done ? 0 : HEAD_Z;
  }
  const foe = rt.actors.find((a) => a.id === mem(e, 'drag'));
  if (foe !== undefined) {
    if (length(sub(foe.pos, rt.hero.pos)) > LET_GO && !done) foe.pos = { x: e.pos.x, y: e.pos.y + 6 };
    else e.mem['drag'] = 0;
  }
  if (!done) return;
  gone();
  changeState(HERO_MACHINE, rt.hero, 'move', heroCtx(rt, EMPTY_FRAME));
}

/** A light foe on the hook is stunned at once, so it can neither bite nor wriggle while it is dragged. */
function stun(rt: SimRt, foe: Entity): void {
  damageActor(rt, foe, {
    amount: 0,
    element: 'none',
    knock: 0,
    dir: normalize(sub(foe.pos, rt.hero.pos)),
    faction: 'hero',
    tags: STUN,
  });
  rt.emit({ t: 'sfx', id: 'sfx_stun' });
}

/** Pulls Ask along the chain to the tile before the post; nothing touches Ask on the way. */
function pull(rt: SimRt, e: Entity, speed: number, gone: () => void): void {
  const target = { x: mem(e, 'toX'), y: mem(e, 'toY') };
  const to = sub(target, rt.hero.pos);
  rt.hero.iframes = Math.max(rt.hero.iframes, 2);
  if (length(to) <= speed) {
    rt.hero.pos = target;
    gone();
    changeState(HERO_MACHINE, rt.hero, 'move', heroCtx(rt, EMPTY_FRAME));
    return;
  }
  const n = normalize(to);
  rt.hero.pos = { x: rt.hero.pos.x + n.x * speed, y: rt.hero.pos.y + n.y * speed };
}
