import type { NpcId, ScriptId } from '@content/ids';
import { mem, setAnim, type Entity } from '../../actors/entity';
import { createNpc } from '../../actors/npc';
import { at, overlaps } from '../../math/box';
import { dirFromVec } from '../../math/dir';
import { length, sub, type Vec } from '../../math/vec';
import type { Escort, SimRt } from '../rt';
import { enemyDef } from './movement';
import { startScript } from './story';

/** How an escorted NPC keeps up (M8): px a tick, how far behind Ask, and when she stops for foes or waits. */
export const ESCORT = {
  speed: 1.4,
  /** Positions of Ask's trail kept, a tick apart; she walks to the one `behind` ticks old. */
  trail: 120,
  behind: 18,
  /** She stops while a foe is this near her, and waits while Ask is this far ahead. */
  wary: 48,
  wait: 160,
  /** Ticks she cannot be hurt again after a blow. */
  iframes: 60,
} as const;

/** The escorted NPC on the screen, if any. */
export function follower(rt: SimRt): Entity | undefined {
  const e = rt.escort;
  if (e === undefined) return undefined;
  return rt.actors.find((a) => a.kind === 'npc' && a.def === e.npc && mem(a, 'escort') === 1);
}

/** Puts the escorted NPC down beside Ask (at the start, and on every new screen). */
export function placeFollower(rt: SimRt, pos: Vec): void {
  const e = rt.escort;
  if (e === undefined) return;
  const def = rt.db.npcs[e.npc];
  if (def === undefined) return;
  rt.actors = rt.actors.filter((a) => !(a.kind === 'npc' && a.def === e.npc));
  const npc = createNpc(
    rt.newId(),
    def,
    { screen: rt.screen.id, at: { x: 0, y: 0 }, facing: rt.hero.facing },
    -1,
  );
  npc.pos = { ...pos };
  npc.mem['escort'] = 1;
  rt.actors.push(npc);
  e.trail = [{ ...pos }];
}

/** Starts walking `npc` along with Ask (an `escort` effect), with `hp` of her own; `lost` runs if she falls. */
export function startEscort(rt: SimRt, npc: NpcId, hp: number, lost: ScriptId): void {
  rt.escort = { npc, hp, max: hp, lost, trail: [], iframes: 0 };
  placeFollower(rt, rt.hero.pos);
}

/** Ends the escort: she is no longer a follower (her own places take over again). */
export function endEscort(rt: SimRt): void {
  const e = rt.escort;
  if (e === undefined) return;
  rt.actors = rt.actors.filter((a) => !(a.kind === 'npc' && a.def === e.npc && mem(a, 'escort') === 1));
  rt.escort = undefined;
}

/**
 * Each tick: Ask's trail grows, and she walks to where Ask was `behind` ticks ago, unless a foe is near
 * her (she stops) or Ask is far ahead (she waits). Foes' blows and touch hurt her as they would Ask; at
 * 0 hp the escort ends and its `lost` script runs.
 */
export function stepEscort(rt: SimRt): void {
  const e = rt.escort;
  const npc = follower(rt);
  if (e === undefined || npc === undefined) return;
  e.trail.push({ ...rt.hero.pos });
  if (e.trail.length > ESCORT.trail) e.trail.shift();
  if (e.iframes > 0) e.iframes -= 1;
  npc.vel = { x: 0, y: 0 };
  if (hurtFollower(rt, e, npc)) return;
  const foes = rt.actors.some(
    (a) => a.kind === 'enemy' && mem(a, 'asleep') !== 1 && length(sub(a.pos, npc.pos)) < ESCORT.wary,
  );
  const far = length(sub(rt.hero.pos, npc.pos)) > ESCORT.wait;
  const target = e.trail[Math.max(0, e.trail.length - 1 - ESCORT.behind)];
  if (foes || far || target === undefined) {
    setAnim(npc, 'idle');
    return;
  }
  const d = sub(target, npc.pos);
  const dist = length(d);
  // Close enough: stand, and never crowd Ask.
  if (dist < 2 || length(sub(rt.hero.pos, npc.pos)) < 18) {
    setAnim(npc, 'idle');
    npc.facing = dirFromVec(sub(rt.hero.pos, npc.pos), npc.facing);
    return;
  }
  const v = Math.min(ESCORT.speed, dist);
  npc.vel = { x: (d.x / dist) * v, y: (d.y / dist) * v };
  npc.facing = dirFromVec(d, npc.facing);
  setAnim(npc, 'walk');
}

/** A foe's blow (or touch) on the escorted NPC. Returns whether she fell. */
function hurtFollower(rt: SimRt, e: Escort, npc: Entity): boolean {
  if (e.iframes > 0) return false;
  const box = at(npc.hurt, npc.pos);
  for (const a of rt.actors) {
    if (a.kind !== 'enemy' || mem(a, 'stun') > 0 || mem(a, 'frozen') > 0 || mem(a, 'asleep') === 1) continue;
    const def = enemyDef(rt, a);
    const w = def.attacks?.[a.fsm.s];
    const blow =
      w !== undefined && a.fsm.t >= w.from && a.fsm.t <= w.to && overlaps(box, at(w.boxes[a.facing], a.pos))
        ? w.amount
        : undefined;
    const touch = def.touch !== undefined && overlaps(box, at(a.hurt, a.pos)) ? def.touch.amount : undefined;
    const amount = blow ?? touch;
    if (amount === undefined) continue;
    e.hp = Math.max(0, e.hp - amount);
    e.iframes = ESCORT.iframes;
    rt.emit({ t: 'hit', target: npc.id, blocked: false, dealt: amount });
    rt.emit({ t: 'sfx', id: 'sfx_hurt' });
    if (e.hp > 0) return false;
    const lost = e.lost;
    endEscort(rt);
    startScript(rt, lost);
    return true;
  }
  return false;
}
