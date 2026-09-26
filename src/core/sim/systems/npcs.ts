import type { NpcId } from '@content/ids';
import { mem, setAnim, type Entity } from '../../actors/entity';
import { NPC_PAUSE, NPC_SPEED, createNpc, type NpcDef, type NpcPlace } from '../../actors/npc';
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

/**
 * Brings the NPCs on the current screen in line with their places: adds arrivals, removes leavers and
 * keeps everyone whose place did not change where they are.
 */
export function placeNpcs(rt: SimRt): void {
  const keep: Entity[] = [];
  const present = new Set<string>();
  for (const a of rt.actors) {
    if (a.kind !== 'npc') {
      keep.push(a);
      continue;
    }
    const def = rt.db.npcs[a.def as NpcId];
    const at = def === undefined ? null : placeOf(rt, def);
    if (at !== null && at.place.screen === rt.screen.id && at.index === mem(a, 'place')) {
      keep.push(a);
      present.add(a.def);
    }
  }
  for (const def of Object.values(rt.db.npcs)) {
    if (present.has(def.id)) continue;
    const at = placeOf(rt, def);
    if (at?.place.screen === rt.screen.id) keep.push(createNpc(rt.newId(), def, at.place, at.index));
  }
  rt.actors = keep;
}

/** Patrols: walk to the next point, pause, repeat. Talking NPCs stand still. */
export function stepNpcs(rt: SimRt): void {
  for (const e of rt.actors) {
    if (e.kind !== 'npc') continue;
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
