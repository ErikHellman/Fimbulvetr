import { outline } from '@art/outline';
import type { Raster } from '@art/raster';
import { grid, mirror, type DrawnFrame } from '../lib/sprite';
import { fade, softened, sunk } from './fx';
import { WISP } from './grids';
import { BELGR, IVALDI, JARNVORDR } from './grids3';
import { BELGR_PAL, GLOD_PAL, IVALDI_HOT_PAL, IVALDI_PAL, WARDEN_PAL } from './palette';
import { INK } from './wights';

/**
 * Dvergagröf's and the Forge's foes: Járnvörðr the iron warden (rising out of the floor), Glóð the ember
 * sprite (the bog-light's grids in coal and flame), Belgr the bellows and Ívaldi the Anvil, whose plate
 * heats white when he walks through the forge fire.
 */
export function forgeFoeFrames(): DrawnFrame[] {
  const out: DrawnFrame[] = [];
  const add = (name: string, raster: Raster, ox: number, oy: number, mirrored: boolean): void => {
    const pivot = { x: ox / raster.w, y: oy / raster.h };
    out.push({ name, raster, pivot });
    if (mirrored) out.push({ name: name.replace(/_w_(\d+)$/, '_e_$1'), raster: mirror(raster), pivot });
  };
  const embers = Object.fromEntries(
    Object.entries(WISP).map(([pose, text]) => [pose, softened(grid(GLOD_PAL, text), '#f06a20')]),
  );
  const ember = (pose: string): Raster => {
    const r = embers[pose];
    if (r === undefined) throw new Error(`no ember pose ${pose}`);
    return r;
  };
  const key = (table: Record<string, string>, k: string): string => {
    const text = table[k];
    if (text === undefined) throw new Error(`no grid ${k}`);
    return text;
  };
  for (const side of ['s', 'n', 'w'] as const) {
    const m = side === 'w';
    // The iron warden: 32×36, feet at (16, 34); it rises out of the floor in four steps.
    const warden = (k: string): Raster => outline(grid(WARDEN_PAL, key(JARNVORDR, `${side}_${k}`)), INK, 1);
    const w = (anim: string, i: number, r: Raster): void => {
      add(`enemy_jarnvordr_${anim}_${side}_${i}`, r, 16, 34, m);
    };
    [12, 8, 4, 0].forEach((sink, i) => {
      w('rise', i, sunk(warden('idle'), sink, 33));
    });
    w('idle', 0, warden('idle'));
    for (let i = 0; i < 4; i++) w('walk', i, warden(`step${i}`));
    w('tell', 0, warden('tell0'));
    w('tell', 1, warden('tell1'));
    w('swing', 0, warden('swing0'));
    w('swing', 1, warden('swing1'));
    w('hurt', 0, fade(warden('hurt'), '#f8d04a', 255));
    // The ember sprite: 24×32, its shadow at (12, 30).
    const g = (anim: string, i: number, pose: string): void => {
      add(`enemy_glod_${anim}_${side}_${i}`, ember(pose), 12, 30, m);
    };
    g('idle', 0, 'a');
    g('fly', 0, 'a');
    g('fly', 1, 'b');
    g('fade', 0, 'faded');
    g('tell', 0, 'flare');
    g('tell', 1, 'a');
    g('dart', 0, 'dart');
    g('hurt', 0, 'faded');
    // Belgr: 44×44, feet at (22, 42).
    const belgr = (k: string): Raster => outline(grid(BELGR_PAL, key(BELGR, `${side}_${k}`)), INK, 1);
    const b = (anim: string, i: number, k: string): void => {
      add(`enemy_belgr_${anim}_${side}_${i}`, belgr(k), 22, 42, m);
    };
    b('idle', 0, 'idle');
    for (let i = 0; i < 4; i++) b('walk', i, `step${i}`);
    b('swell', 0, 'swell0');
    b('swell', 1, 'swell1');
    b('breathe', 0, 'breathe0');
    b('breathe', 1, 'breathe1');
    b('draw', 0, 'draw');
    b('reel', 0, 'reel');
    // Ívaldi: 40×50, feet at (20, 48).
    const ivaldi = (k: string, hot = false): Raster =>
      outline(grid(hot ? IVALDI_HOT_PAL : IVALDI_PAL, key(IVALDI, `${side}_${k}`)), INK, 1);
    const v = (anim: string, i: number, r: Raster): void => {
      add(`enemy_ivaldi_${anim}_${side}_${i}`, r, 20, 48, m);
    };
    v('idle', 0, ivaldi('idle'));
    v('roar', 0, ivaldi('roar'));
    for (let i = 0; i < 4; i++) {
      v('walk', i, ivaldi(`step${i}`));
      v('hotwalk', i, ivaldi(`step${i}`, true));
    }
    v('raise', 0, ivaldi('raise'));
    v('slam', 0, ivaldi('slam'));
    v('stuck', 0, ivaldi('stuck'));
    v('open', 0, ivaldi('open'));
    v('anvil', 0, ivaldi('idle'));
    v('fallen', 0, ivaldi('fallen'));
  }
  return out;
}
