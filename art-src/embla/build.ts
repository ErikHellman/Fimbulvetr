import { outline } from '@art/outline';
import { C } from '@art/palette';
import { hex, type Raster } from '@art/raster';
import { frame, mirror, paste, type DrawnFrame } from '../lib/sprite';
import { BODICE, BRAID, HEAD, SKIRT } from './parts';

type Side = 's' | 'w' | 'n';
const SIDES: readonly Side[] = ['s', 'w', 'n'];
const SIZE = 32;
const X = 9;
const Y = 4;
const INK = hex(C.ink);
/** Feet on row 29, as the placeholder people (`ox: 16, oy: 30`). */
const PIVOT = { x: 0.5, y: 30 / SIZE };
/** Which bodice goes with each walk frame: the hands swing on the mid-step frames. */
const SWING = [0, 1, 0, 2] as const;

function pose(side: Side, step: number, bob: boolean): Raster {
  const r = frame(SIZE);
  const dy = bob || step % 2 === 1 ? 1 : 0;
  const pick = <T>(list: readonly T[], i: number): T => {
    const found = list[i] ?? list[0];
    if (found === undefined) throw new Error('empty part list');
    return found;
  };
  if (side === 'n') paste(r, BRAID.n.raster, X + BRAID.n.dx, Y + BRAID.n.dy + dy);
  paste(r, pick(SKIRT[side], step), X, Y + 20);
  paste(r, pick(BODICE[side], SWING[step] ?? 0), X, Y + 13 + dy);
  paste(r, HEAD[side], X, Y + dy);
  if (side !== 'n') paste(r, BRAID[side].raster, X + BRAID[side].dx, Y + BRAID[side].dy + dy);
  return outline(r, INK, 1);
}

/** Embla's frames under the placeholder names `npc_embla_<anim>_<dir>_<n>`. */
export function emblaFrames(): DrawnFrame[] {
  const out: DrawnFrame[] = [];
  const add = (anim: string, side: Side, i: number, raster: Raster): void => {
    out.push({ name: `npc_embla_${anim}_${side}_${i}`, raster, pivot: PIVOT });
    if (side === 'w') out.push({ name: `npc_embla_${anim}_e_${i}`, raster: mirror(raster), pivot: PIVOT });
  };
  for (const side of SIDES) {
    add('idle', side, 0, pose(side, 0, false));
    add('idle', side, 1, pose(side, 0, true));
    for (let i = 0; i < 4; i++) add('walk', side, i, pose(side, i, false));
  }
  return out;
}
