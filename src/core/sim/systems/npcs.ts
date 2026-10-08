import type { NpcId } from '@content/ids';
import { mem, setAnim, type Entity } from '../../actors/entity';
import { NPC_BODY, NPC_PAUSE, NPC_SPEED, createNpc, type NpcDef, type NpcPlace } from '../../actors/npc';
import { at, overlaps } from '../../math/box';
import { dirFromVec } from '../../math/dir';
import { length, sub } from '../../math/vec';
import { evalCond } from '../../story/cond';
import { tileFeet } from '../../world/screen';
import type { SimRt } from '../rt';
import { condCtx } from './story';

/** The NPC's current place (and its index), or null when it is elsewhere or away. */
export function placeOf(rt: SimRt, def: NpcDef): { place: NpcPlace; index: number } | null {
  const ctx = condCtx(rt);
  const index = def.places.findIndex((p) => evalCond(p.when, ctx));
  const place = def.places[index];
  return place === undefined ? null : { place, index };
}

/** How often (ticks of play) NPCs check their schedule while the hero is on their screen. */
export const SCHEDULE_TICKS = 60;

/**
 * Brings the NPCs on the current screen in line with their places: adds arrivals, removes leavers and
 * keeps everyone whose place did not change where they are. With `guard`, an arrival waits while the hero
 * stands on its spot.
 */
export function placeNpcs(rt: SimRt, guard = false): void {
  const hero = at(rt.hero.body, rt.hero.pos);
  const keep: Entity[] = [];
  const present = new Set<string>();
  for (const a of rt.actors) {
    // An escorted NPC walks with Ask, whatever her places say.
    if (a.kind !== 'npc' || mem(a, 'escort') === 1) {
      keep.push(a);
      continue;
    }
    const def = rt.db.npcs[a.def as NpcId];
    const place = def === undefined ? null : placeOf(rt, def);
    if (place !== null && place.place.screen === rt.screen.id && place.index === mem(a, 'place')) {
      keep.push(a);
      present.add(a.def);
    }
  }
  for (const def of Object.values(rt.db.npcs)) {
    if (present.has(def.id) || rt.escort?.npc === def.id) continue;
    const place = placeOf(rt, def);
    if (place?.place.screen !== rt.screen.id) continue;
    if (guard && overlaps(hero, at(NPC_BODY, tileFeet(place.place.at)))) continue;
    keep.push(createNpc(rt.newId(), def, place.place, place.index));
  }
  rt.actors = keep;
}

/** Schedules: every second of play, NPCs on this screen follow their places (home at dusk, out at dawn). */
export function scheduleNpcs(rt: SimRt): void {
  if (rt.state.playTicks % SCHEDULE_TICKS === 0) placeNpcs(rt, true);
}

/** Patrols: walk to the next point, pause, repeat. Talking NPCs stand still. */
export function stepNpcs(rt: SimRt): void {
  for (const e of rt.actors) {
    if (e.kind !== 'npc' || mem(e, 'escort') === 1) continue;
    e.vel = { x: 0, y: 0 };
    const def = rt.db.npcs[e.def as NpcId];
    const patrol = def?.places[mem(e, 'place')]?.patrol ?? [];
    if (mem(e, 'talking') === 1 || patrol.length === 0) {
      setAnim(e, 'idle');
      continue;
    }
    if (mem(e, 'wait') > 0) {
      e.mem['wait'] = mem(e, 'wait') - 1;
      setAnim(e, 'idle');
      continue;
    }
    const target = patrol[mem(e, 'leg') % patrol.length];
    if (target === undefined) continue;
    const d = sub(tileFeet(target), e.pos);
    const dist = length(d);
    if (dist <= NPC_SPEED) {
      e.pos = tileFeet(target);
      e.mem['leg'] = (mem(e, 'leg') + 1) % patrol.length;
      e.mem['wait'] = NPC_PAUSE;
      setAnim(e, 'idle');
      continue;
    }
    e.vel = { x: (d.x / dist) * NPC_SPEED, y: (d.y / dist) * NPC_SPEED };
    e.facing = dirFromVec(d, e.facing);
    setAnim(e, 'walk');
  }
}
