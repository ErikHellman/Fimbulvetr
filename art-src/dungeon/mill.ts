import { outline } from '@art/outline';
import { C } from '@art/palette';
import { hex, type Raster } from '@art/raster';
import { grid, mirror, type DrawnFrame } from '../lib/sprite';
import { CRAB, LINDORMR, MOUND } from './grids';
import { CRAB_PAL, LIND_PAL } from './palette';

/**
 * Sökkva Kvern's foes: the mud-crab (leirkrabbi) that scuttles the sluices, and the lindormr, the
 * serpent in the mud under the mill, with the mounds it hides in. Drawn from the front, from behind
 * and from the west; east is mirrored.
 */
const INK = hex(C.ink);
type View = 'front' | 'back' | 'side';
const VIEWS: readonly (readonly ['s' | 'n' | 'w', View])[] = [
  ['s', 'front'],
  ['n', 'back'],
  ['w', 'side'],
];
const DIRS = ['s', 'n', 'w', 'e'] as const;

export function millFrames(): DrawnFrame[] {
  const out: DrawnFrame[] = [];
  const add = (name: string, raster: Raster, ox: number, oy: number, mirrored: boolean): void => {
    const pivot = { x: ox / raster.w, y: oy / raster.h };
    out.push({ name, raster, pivot });
    if (mirrored) out.push({ name: name.replace(/_w_(\d+)$/, '_e_$1'), raster: mirror(raster), pivot });
  };
  for (const [dir, view] of VIEWS) {
    const crab = (anim: string, i: number, pose: string): void => {
      const raster = outline(grid(CRAB_PAL, CRAB[`${view}_${pose}` as keyof typeof CRAB]), INK, 1);
      add(`enemy_leirkrabbi_${anim}_${dir}_${i}`, raster, 16, 21, dir === 'w');
    };
    crab('idle', 0, 'rest');
    crab('walk', 0, 'rest');
    crab('walk', 1, 'step');
    crab('tell', 0, 'raise');
    crab('pinch', 0, 'snap');
    crab('hurt', 0, 'hurt');
    for (const pose of [
      'idle',
      'hidden',
      'tell',
      'rear',
      'roar',
      'ripple',
      'dazed',
      'coil',
      'charge',
      'burrow',
    ]) {
      const raster = outline(grid(LIND_PAL, LINDORMR[`${view}_${pose}` as keyof typeof LINDORMR]), INK, 1);
      add(`enemy_lindormr_${pose}_${dir}_0`, raster, 24, 44, dir === 'w');
    }
  }
  const mounds = MOUND.map((text) => outline(grid(LIND_PAL, text), INK, 1));
  const mound = (i: number): Raster => {
    const r = mounds[i];
    if (r === undefined) throw new Error(`no mound ${i}`);
    return r;
  };
  for (const dir of DIRS) {
    add(`enemy_lind_mound_idle_${dir}_0`, mound(0), 14, 21, false);
    add(`enemy_lind_mound_bubble_${dir}_0`, mound(1), 14, 21, false);
    add(`enemy_lind_mound_bubble_${dir}_1`, mound(2), 14, 21, false);
  }
  return out;
}
