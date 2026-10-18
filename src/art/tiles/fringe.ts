import type { TerrainId } from '@content/terrain';
import { nextFloat } from '@core/math/rng';
import { C } from '../palette';
import type { Painter } from '../painter';
import { clip, clods, ridges, tufts, type Tones } from '../texture';
import { insideBlob } from './blob';

type Grain = 'tufts' | 'clods' | 'ridges';

export interface FringeArt {
  readonly tones: Tones;
  readonly grain: Grain;
}

/** How each spilling ground looks where it overlaps its neighbour (keyed as FRINGE_SPILL.spill is). */
export const FRINGE_ART: Readonly<Partial<Record<TerrainId, FringeArt>>> = {
  grass: { tones: { base: C.grass, shade: C.grassShade, light: C.grassLight }, grain: 'tufts' },
  heath: { tones: { base: '#6f6a44', shade: '#57533a', light: '#8a8560' }, grain: 'tufts' },
  moss: { tones: { base: '#355a2c', shade: '#26441f', light: '#4f7a3a' }, grain: 'tufts' },
  mire: { tones: { base: '#4e5a4c', shade: '#3c463b', light: '#6c7a64' }, grain: 'tufts' },
  firn: { tones: { base: '#e4ecf2', shade: '#c8d6e2', light: '#ffffff' }, grain: 'ridges' },
  bog: { tones: { base: '#4a5236', shade: '#3a4029', light: '#6a7a44' }, grain: 'tufts' },
  sand: { tones: { base: '#d6c48f', shade: '#b8a36e', light: '#eee0b0' }, grain: 'ridges' },
  scree: { tones: { base: '#7a7672', shade: '#54504c', light: '#9a9690' }, grain: 'clods' },
  cave_floor: { tones: { base: C.caveFloor, shade: '#3e3630', light: C.caveFloorLight }, grain: 'clods' },
};

export const FRINGE_IDS = Object.keys(FRINGE_ART) as readonly TerrainId[];

/** How far the fringe reaches into the tile, and the ragged band beyond it. */
const REACH = 2;
const RAGGED = 0.45;

/**
 * A transparent overlay: `own` is the blob mask of the cells that are NOT the spilling ground (the
 * complement of the fringe mask), so everything outside that blob, inset `REACH`, is the neighbour's ground
 * spilling in, with a ragged row beyond it and the ground's own grain on top.
 */
export function paintFringe(p: Painter, own: number, art: FringeArt): void {
  const covered = (x: number, y: number): boolean => !insideBlob(own, x, y, REACH);
  const ragged = (x: number, y: number): boolean =>
    !covered(x, y) && !insideBlob(own, x, y, REACH + 1) && nextFloat(p.rng) < RAGGED;
  const mask: boolean[] = [];
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++) {
      const on = covered(x, y) || ragged(x, y);
      mask.push(on);
      if (on) p.px(x, y, art.tones.base);
    }
  const inside = (x: number, y: number): boolean => mask[y * 16 + x] === true;
  const c = clip(p, inside);
  if (art.grain === 'tufts') tufts(c, art.tones, 3, 0.7);
  else if (art.grain === 'clods') clods(c, art.tones, 4, 2);
  else ridges(c, art.tones, 3, 4);
}
