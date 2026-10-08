import { mem, setAnim, type Entity } from '../../actors/entity';
import { at, overlaps, type Box } from '../../math/box';
import type { Dir4 } from '../../math/dir';
import { evalCond } from '../../story/cond';
import { LOW, SOLID } from '../../world/collision';
import { TILE } from '../../world/dims';
import { otherSlant, prismTurn, traceBeam, type BeamMeet, type Slant } from '../../world/beam';
import type { SimRt } from '../rt';
import { thingOf } from './fixtures';
import { condCtx } from './story';

/** A beam's stretch in screen pixels, tile middle to tile middle, for the view. */
export interface BeamSeg {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

const mid = (t: number): number => t * TILE + TILE / 2;

/** A prism fixture's slant now: its thing's, or the other once struck. */
export function slantOf(rt: SimRt, e: Entity): Slant {
  const t = thingOf(rt, e);
  const base: Slant = t?.k === 'prism' ? t.turn : '/';
  return mem(e, 'turn') === 1 ? otherSlant(base) : base;
}

/** Turns the prism a quarter (a sword blow or a Bragð beam), if it is one that turns. */
export function turnPrism(rt: SimRt, e: Entity): boolean {
  const t = thingOf(rt, e);
  if (t?.k !== 'prism' || t.turns !== true) return false;
  e.mem['turn'] = mem(e, 'turn') === 1 ? 0 : 1;
  setAnim(e, slantOf(rt, e) === '/' ? 'slash' : 'back');
  rt.emit({ t: 'sfx', id: 'sfx_glass' });
  return true;
}

/** Lights the eye fixture: its flag is set for good. */
export function lightEye(rt: SimRt, e: Entity): void {
  const t = thingOf(rt, e);
  if (t?.k !== 'eye' || rt.state.flags[t.flag] === true) return;
  rt.state.flags[t.flag] = true;
  rt.emit({ t: 'sfx', id: 'sfx_glass' });
}

/** The prism or eye fixture standing on tile (x, y), if any. */
function glassAt(rt: SimRt, x: number, y: number): Entity | undefined {
  return rt.actors.find(
    (a) =>
      a.kind === 'fixture' &&
      (a.def === 'prism' || a.def === 'eye') &&
      mem(a, 'tx') === x &&
      mem(a, 'ty') === y,
  );
}

/** The prism or eye fixture under `box` (a sword's blow, a Bragð beam's head). */
export function glassUnder(rt: SimRt, box: Box): Entity | undefined {
  return rt.actors.find(
    (a) => a.kind === 'fixture' && (a.def === 'prism' || a.def === 'eye') && overlaps(box, at(a.hurt, a.pos)),
  );
}

/** What a beam travelling `dir` meets on (x, y) this tick. */
function meetAt(rt: SimRt, x: number, y: number, dir: Dir4): BeamMeet {
  const glass = glassAt(rt, x, y);
  if (glass?.def === 'prism') return { k: 'turn', dir: prismTurn(slantOf(rt, glass), dir) };
  if (glass?.def === 'eye') return { k: 'eye', index: glass.id };
  const h = rt.hero;
  if (h.fsm.s === 'mirror' && Math.floor(h.pos.x / TILE) === x && Math.floor((h.pos.y - 1) / TILE) === y)
    // The mirror sends light on the way Ask faces; its back (facing the way the light runs) stops it.
    return h.facing === dir ? { k: 'stop' } : { k: 'turn', dir: h.facing };
  const g = rt.screen.collision;
  const f = g.flags[y * g.cols + x] ?? 0;
  // Light crosses open floor, and pits and water as a shot does.
  if ((f & SOLID) === 0 || (f & LOW) !== 0) return { k: 'pass' };
  const t = rt.screen.terrain.cells[y * rt.screen.terrain.cols + x];
  // Clear ice lets light through, unless something stands in it (a closed gate is still a gate).
  const solidThing = rt.actors.some(
    (a) => a.kind === 'fixture' && mem(a, 'tx') === x && mem(a, 'ty') === y && a.def !== 'scenery',
  );
  return t !== undefined && rt.db.terrain[t].clear === true && !solidThing ? { k: 'pass' } : { k: 'stop' };
}

/**
 * Traces every lit window's beam on the screen (M9b): prisms turn it, the raised mirror redirects it, eyes
 * it reaches are lit for good. The stretches are kept for the view (`Sim.beams()`).
 */
export function stepBeams(rt: SimRt): void {
  const segs: BeamSeg[] = [];
  for (const e of rt.actors) {
    if (e.kind !== 'fixture' || e.def !== 'beam') continue;
    const t = thingOf(rt, e);
    if (t?.k !== 'beam' || !evalCond(t.when, condCtx(rt))) continue;
    const trace = traceBeam(t.at.x, t.at.y, t.dir, (x, y, d) => meetAt(rt, x, y, d));
    for (const r of trace.runs) segs.push({ x0: mid(r.x0), y0: mid(r.y0), x1: mid(r.x1), y1: mid(r.y1) });
    for (const id of trace.eyes) {
      const eye = rt.actors.find((a) => a.id === id);
      if (eye !== undefined) lightEye(rt, eye);
    }
  }
  rt.beamSegs = segs.length === 0 ? undefined : segs;
}
