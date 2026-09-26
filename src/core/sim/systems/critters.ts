import type { CritterId } from '@content/ids';
import { CRITTER_MACHINES, type CritterDef } from '../../actors/critters';
import type { ActorCtx } from '../../actors/enemies/defs';
import { mem, type Entity } from '../../actors/entity';
import { runFsm } from '../../actors/fsm';
import { TILE } from '../../world/dims';
import type { Thing } from '../../world/screen';
import type { SimRt } from '../rt';
import { applyAll } from './story';

type PenThing = Extract<Thing, { k: 'pen' }>;

export const critterDef = (rt: SimRt, e: Entity): CritterDef => rt.db.critters[e.def as CritterId];

export function penOf(rt: SimRt): PenThing | null {
  for (const t of rt.db.screens[rt.screen.id].things) if (t.k === 'pen') return t;
  return null;
}

const inPen = (pen: PenThing, x: number, y: number): boolean => {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor((y - 1) / TILE);
  return tx >= pen.at.x && tx < pen.at.x + pen.w && ty >= pen.at.y && ty < pen.at.y + pen.h;
};

const popcount = (n: number): number => {
  let c = 0;
  for (let v = n; v > 0; v >>= 1) c += v & 1;
  return c;
};

export function runCritters(rt: SimRt, ctx: ActorCtx): void {
  for (const e of rt.actors) {
    if (e.kind === 'critter') runFsm(CRITTER_MACHINES[critterDef(rt, e).behaviour], e, ctx);
  }
}

/** After movement: pen sheep, keep penned sheep inside, and let scared-off critters go. */
export function settleCritters(rt: SimRt): void {
  const pen = penOf(rt);
  const things = rt.db.screens[rt.screen.id].things;
  for (const e of [...rt.actors]) {
    if (e.kind !== 'critter') continue;
    if (mem(e, 'gone') === 1) {
      rt.actors = rt.actors.filter((a) => a !== e);
      const thing = things[mem(e, 'thing')];
      if (thing?.k === 'critter') applyAll(rt, thing.onGone ?? []);
      continue;
    }
    if (pen === null || e.mem['tag'] === undefined) continue;
    if (mem(e, 'penned') === 1) {
      const x0 = pen.at.x * TILE - e.body.x;
      const x1 = (pen.at.x + pen.w) * TILE - (e.body.x + e.body.w);
      const y0 = pen.at.y * TILE - e.body.y;
      const y1 = (pen.at.y + pen.h) * TILE - (e.body.y + e.body.h);
      e.pos = { x: Math.min(x1, Math.max(x0, e.pos.x)), y: Math.min(y1, Math.max(y0, e.pos.y)) };
    } else if (inPen(pen, e.pos.x, e.pos.y)) {
      e.mem['penned'] = 1;
      const mask = (rt.state.world.vars[pen.v] ?? 0) | (1 << mem(e, 'tag'));
      rt.state.world.vars[pen.v] = mask;
      rt.emit({ t: 'sfx', id: 'sfx_bleat' });
      if (popcount(mask) >= pen.count) rt.state.flags[pen.flag] = true;
    }
  }
}
