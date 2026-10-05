import { createEntity, mem, setAnim, type Entity } from '../../actors/entity';
import { at, overlaps, type Box } from '../../math/box';
import { TILE } from '../../world/dims';
import type { Thing, TilePos } from '../../world/screen';
import type { SimRt } from '../rt';
import { stampCollision } from './fixtures';

/** A raft's pace (px a tick) and how long it rests at each stop (ticks). */
export const RAFT = { speed: 1, wait: 90 } as const;

/** Its 2×2 deck, around its ground point (the middle of its bottom edge). */
const DECK = { x: -16, y: -30, w: 32, h: 32 } as const;

type RaftThing = Extract<Thing, { k: 'raft' }>;

/** Where a raft resting with its top-left tile at `t` has its ground point. */
const restAt = (t: TilePos): { x: number; y: number } => ({
  x: t.x * TILE + TILE,
  y: t.y * TILE + 2 * TILE - 2,
});

/** A raft at its first stop, about to rest there. */
export function createRaft(rt: SimRt, thing: RaftThing, index: number): Entity {
  const e = createEntity({
    id: rt.newId(),
    kind: 'fixture',
    def: 'raft',
    art: thing.sail === true ? 'fix_sailraft' : 'fix_raft',
    pos: restAt(thing.at),
    facing: 's',
    body: DECK,
    hurt: DECK,
    faction: 'env',
    hp: 1,
    maxHp: 1,
    state: 'idle',
  });
  setAnim(e, 'idle');
  e.mem['thing'] = index;
  e.mem['tx'] = thing.at.x;
  e.mem['ty'] = thing.at.y;
  e.mem['stop'] = 0;
  e.mem['step'] = 1;
  e.mem['wait'] = RAFT.wait;
  return e;
}

/** The stops a raft plies, its own resting place first. */
function stopsOf(rt: SimRt, e: Entity): readonly TilePos[] {
  const t = rt.db.screens[rt.screen.id].things[mem(e, 'thing')];
  return t?.k === 'raft' ? [t.at, ...t.path] : [];
}

/** Whether a raft carries a sail (it leaves a stop only when a gust fills it). */
function sails(rt: SimRt, e: Entity): boolean {
  const t = rt.db.screens[rt.screen.id].things[mem(e, 'thing')];
  return t?.k === 'raft' && t.sail === true;
}

/** A Vindr gust fills the sail of every resting sailing raft whose deck it touches. Returns whether one filled. */
export function fillSail(rt: SimRt, box: Box): boolean {
  let any = false;
  for (const e of rt.actors) {
    if (e.kind !== 'fixture' || e.def !== 'raft' || !sails(rt, e) || mem(e, 'moving') === 1) continue;
    if (mem(e, 'filled') === 1 || !overlaps(box, at(e.body, e.pos))) continue;
    e.mem['filled'] = 1;
    any = true;
  }
  return any;
}

/** Whether Ask's feet are on the raft's deck. */
function aboard(rt: SimRt, e: Entity): boolean {
  const deck = at(e.body, e.pos);
  const { x, y } = rt.hero.pos;
  return x >= deck.x && x < deck.x + deck.w && y >= deck.y && y < deck.y + deck.h;
}

/** Whether the grapple has hooked a post and is pulling Ask along its chain (a throw at anything else is not). */
const pulled = (rt: SimRt): boolean =>
  rt.actors.some((a) => a.kind === 'projectile' && a.def === 'grapple' && a.fsm.s === 'pull');

/**
 * Rafts rest, then set off for their next stop (turning back at either end of the path), carrying Ask if
 * Ask's feet were on the deck as it left. Aboard and moving, Ask cannot walk (`hero.mem.raft`); a grapple
 * pull to a post leaves the raft behind, while a throw at a foe or at nothing keeps Ask aboard.
 */
export function stepRafts(rt: SimRt): void {
  let restamp = false;
  let riding = false;
  for (const e of rt.actors) {
    if (e.kind !== 'fixture' || e.def !== 'raft') continue;
    if (mem(e, 'moving') !== 1) {
      const wait = Math.max(0, mem(e, 'wait') - 1);
      e.mem['wait'] = wait;
      if (wait > 0) continue;
      // A sailing raft waits at its stop for a gust in its sail.
      if (sails(rt, e) && mem(e, 'filled') !== 1) continue;
      const stops = stopsOf(rt, e);
      if (stops.length < 2) continue;
      let next = mem(e, 'stop') + mem(e, 'step');
      if (next < 0 || next >= stops.length) {
        e.mem['step'] = -mem(e, 'step');
        next = mem(e, 'stop') + mem(e, 'step');
      }
      e.mem['stop'] = next;
      e.mem['moving'] = 1;
      e.mem['ride'] = aboard(rt, e) && !pulled(rt) ? 1 : 0;
      restamp = true;
    }
    const to = restAt(stopsOf(rt, e)[mem(e, 'stop')] ?? { x: mem(e, 'tx'), y: mem(e, 'ty') });
    const dx = Math.sign(to.x - e.pos.x) * Math.min(RAFT.speed, Math.abs(to.x - e.pos.x));
    const dy = Math.sign(to.y - e.pos.y) * Math.min(RAFT.speed, Math.abs(to.y - e.pos.y));
    if (mem(e, 'ride') === 1 && pulled(rt)) e.mem['ride'] = 0;
    e.pos = { x: e.pos.x + dx, y: e.pos.y + dy };
    if (mem(e, 'ride') === 1) {
      rt.hero.pos = { x: rt.hero.pos.x + dx, y: rt.hero.pos.y + dy };
      rt.hero.vel = { x: 0, y: 0 };
      rt.hero.knock = { x: 0, y: 0 };
      riding = true;
    }
    if (e.pos.x !== to.x || e.pos.y !== to.y) continue;
    const stop = stopsOf(rt, e)[mem(e, 'stop')];
    e.mem['tx'] = stop?.x ?? mem(e, 'tx');
    e.mem['ty'] = stop?.y ?? mem(e, 'ty');
    e.mem['moving'] = 0;
    e.mem['ride'] = 0;
    if (sails(rt, e)) e.mem['filled'] = 0;
    e.mem['wait'] = RAFT.wait;
    restamp = true;
  }
  // Kept off Ask's memory unless aboard, so a world without rafts hashes as it always did.
  if (riding) rt.hero.mem['raft'] = 1;
  else if (rt.hero.mem['raft'] !== undefined) delete rt.hero.mem['raft'];
  if (restamp) stampCollision(rt);
}
