import { outline } from '@art/outline';
import { C } from '@art/palette';
import { createRaster, hex, type Raster } from '@art/raster';
import { grid, mirror, paste, type DrawnFrame } from '../lib/sprite';
import { type Hide, trollPalette } from './palette';
import {
  BACK_BODY,
  FRONT_BODY,
  FRONT_CLUB,
  FRONT_LEGS,
  SIDE_BODY,
  SIDE_CLUB,
  SIDE_LEGS,
} from './troll_grids';

/**
 * The troll, 48×56 with its feet on row 54: a hunched bulk with its head low between the shoulders,
 * moss on its scalp and its back, a club in its right hand. The raid troll, the forest troll and the
 * troll the sun turned to stone share the drawing and differ by their hide.
 */

type Side = 's' | 'w' | 'n';
export type Club = 'down' | 'up' | 'smash';
const INK = hex(C.ink);
const PIVOT = { x: 0.5, y: 54 / 56 };

export function troll(side: Side, phase: number, club: Club, hide: Hide): Raster {
  const pal = trollPalette(hide);
  const r = createRaster(48, 56);
  const at = (text: string, dy = 0): void => {
    paste(r, grid(pal, text), 0, dy);
  };
  if (side === 'w') {
    at(SIDE_LEGS[phase] ?? SIDE_LEGS[0] ?? '');
    at(SIDE_BODY, phase % 2 === 1 ? 1 : 0);
    at(SIDE_CLUB[club], phase % 2 === 1 ? 1 : 0);
  } else {
    const lift = phase === 1 ? 1 : phase === 3 ? 2 : 0;
    at(FRONT_LEGS[lift] ?? '');
    if (side === 'n') at(FRONT_CLUB[club], phase % 2 === 1 ? 1 : 0);
    at(side === 'n' ? BACK_BODY : FRONT_BODY, phase % 2 === 1 ? 1 : 0);
    if (side !== 'n') at(FRONT_CLUB[club], phase % 2 === 1 ? 1 : 0);
  }
  return outline(r, INK, 1);
}

export function trollFrames(art: string, hide: Hide): DrawnFrame[] {
  const out: DrawnFrame[] = [];
  const add = (anim: string, side: Side, i: number, raster: Raster): void => {
    out.push({ name: `${art}_${anim}_${side}_${i}`, raster, pivot: PIVOT });
    if (side === 'w') out.push({ name: `${art}_${anim}_e_${i}`, raster: mirror(raster), pivot: PIVOT });
  };
  for (const side of ['s', 'w', 'n'] as const) {
    add('idle', side, 0, troll(side, 0, 'down', hide));
    for (let i = 0; i < 4; i++) add('walk', side, i, troll(side, i, 'down', hide));
    add('tell', side, 0, troll(side, 0, 'up', hide));
    add('tell', side, 1, troll(side, 2, 'up', hide));
    add('smash', side, 0, troll(side, 0, 'smash', hide));
    add('smash', side, 1, troll(side, 2, 'smash', hide));
  }
  return out;
}
