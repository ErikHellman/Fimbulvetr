import type { EnemyId, PropId } from '@content/ids';
import { mem, type Entity } from '../../actors/entity';
import { at, overlaps } from '../../math/box';
import { evalCond } from '../../story/cond';
import type { RoomSignal, Thing } from '../../world/screen';
import type { SimRt } from '../rt';
import { condCtx } from './story';

/** Whether the room has fixtures of `def` and every one of them is lit. */
function allLit(rt: SimRt, def: string): boolean {
  const all = rt.actors.filter((a) => a.kind === 'fixture' && a.def === def);
  return all.length > 0 && all.every((a) => mem(a, 'lit') === 1);
}

const SIGNALS: Readonly<Record<RoomSignal, (rt: SimRt) => boolean>> = {
  clear: (rt) => !rt.actors.some((a) => a.kind === 'enemy' && !rt.db.enemies[a.def as EnemyId].immortal),
  switches: (rt) => allLit(rt, 'switch'),
  braziers: (rt) => allLit(rt, 'brazier'),
  blocks: (rt) => {
    const all = rt.actors.filter((a) => a.kind === 'prop' && rt.db.props[a.def as PropId].pushable === true);
    return all.length > 0 && all.every((a) => mem(a, 'moved') === 1);
  },
};

/** Whether a room-wide signal holds right now. */
export const roomSignal = (rt: SimRt, signal: RoomSignal): boolean => SIGNALS[signal](rt);

/** Things that show themselves once their condition holds (chests, heart containers). */
type Waiting = Extract<Thing, { k: 'chest' | 'heart' }>;

const waitingThing = (rt: SimRt, e: Entity): Waiting | null => {
  const thing = rt.db.screens[rt.screen.id].things[mem(e, 'thing')];
  return thing?.k === 'chest' || thing?.k === 'heart' ? thing : null;
};

/** Whether a waiting thing may show itself now. */
function ready(rt: SimRt, thing: Waiting): boolean {
  return evalCond(thing.when, condCtx(rt)) && (thing.appear === undefined || roomSignal(rt, thing.appear));
}

/** Marks a freshly spawned chest or heart as waiting (hidden) when its condition does not hold yet. */
export function holdBack(rt: SimRt, e: Entity): void {
  const thing = waitingThing(rt, e);
  if (thing === null || ready(rt, thing)) return;
  e.mem['wait'] = 1;
  e.mem['hidden'] = 1;
}

/**
 * Shows waiting things whose condition now holds, with one chime. A solid one (a chest) waits while Ask
 * stands on its tile.
 */
export function revealThings(rt: SimRt): void {
  let chimed = false;
  const hero = at(rt.hero.body, rt.hero.pos);
  for (const e of rt.actors) {
    if (mem(e, 'wait') !== 1) continue;
    const thing = waitingThing(rt, e);
    if (thing === null || !ready(rt, thing)) continue;
    if (e.kind === 'fixture' && overlaps(hero, at(e.body, e.pos))) continue;
    e.mem['wait'] = 0;
    e.mem['hidden'] = 0;
    if (!chimed) rt.emit({ t: 'sfx', id: 'sfx_secret' });
    chimed = true;
  }
}
