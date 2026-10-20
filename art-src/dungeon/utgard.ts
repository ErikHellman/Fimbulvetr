import { ellipse, line } from '@art/draw';
import { blit, createRaster, hex, type Raster, type Rgba } from '@art/raster';
import { LOOKS } from '@art/sprites/people';
import { grid, mirror, type DrawnFrame } from '../lib/sprite';
import { inked, shadowed } from './fx';
import { HAND, HRIMNIR, JOTUNVORDR, PILLAR } from './grids3';
import { JOTUN_PAL, JOTUN_THAW_PAL, KING_PAL } from './palette';
import { NO_GEAR, Wight, type Arms, type Side } from './wights';

const SHADOW: Rgba = [0, 0, 0, 80];
const STAFF = hex('#5a4630');
const STAFF_LIGHT = hex('#8a6a46');
const TIP = hex('#c8f2ff');
const TIP_LIT = hex('#9ae8ff');

/**
 * Útgarðr's foes: Jötunvörðr the warden in his hauberk of rime, Kolbeinn the seiðmaðr on the villagers'
 * body with his staff, and Hrímnir the Rime King risen to the waist out of the binding-rune, with his hand
 * and the pillars he brings down.
 */
export function utgardFoeFrames(): DrawnFrame[] {
  const out: DrawnFrame[] = [];
  const add = (name: string, raster: Raster, ox: number, oy: number, mirrored: boolean): void => {
    const pivot = { x: ox / raster.w, y: oy / raster.h };
    out.push({ name, raster, pivot });
    if (mirrored) out.push({ name: name.replace(/_w_(\d+)$/, '_e_$1'), raster: mirror(raster), pivot });
  };
  const key = (table: Record<string, string>, k: string): string => {
    const text = table[k];
    if (text === undefined) throw new Error(`no grid ${k}`);
    return text;
  };
  const kolbeinn = new Wight(LOOKS.kolbeinn, {});
  /** Kolbeinn: 40×40, feet at (20, 35), the people body with a seiðr-staff. */
  const seidmadr = (side: Side, pose: string): Raster => {
    const r = createRaster(40, 40);
    ellipse(r, 20, 35, 9, 2, () => SHADOW);
    const arms: Arms = pose === 'cast' || pose === 'draw' ? 'up' : pose === 'strike' ? 'forward' : 'down';
    const step = pose === 'walk0' ? 1 : pose === 'walk1' ? 3 : 0;
    blit(r, kolbeinn.pose(side, step, arms, NO_GEAR), 4, 5);
    const staff = (x0: number, y0: number, x1: number, y1: number): void => {
      line(r, x0, y0, x1, y1, STAFF);
      line(r, x0 + 1, y0, x1 + 1, y1, STAFF_LIGHT);
    };
    if (pose === 'draw') {
      staff(30, 30, 34, 8);
      ellipse(r, 34, 7, 2, 2, () => TIP);
    } else if (pose === 'strike') {
      staff(8, 24, 32, 20);
      ellipse(r, 6, 23, 2, 2, () => TIP);
    } else if (pose === 'cast') {
      staff(31, 32, 31, 7);
      ellipse(r, 31, 6, 2.5, 2.5, () => TIP_LIT);
      ellipse(r, 31, 6, 1, 1, () => hex('#ffffff'));
    } else if (pose === 'reel') {
      staff(6, 30, 14, 14);
      ellipse(r, 14, 13, 2, 2, () => TIP);
    } else {
      staff(29, 33, 29, 10);
      ellipse(r, 29, 9, 2, 2, () => TIP);
    }
    return r;
  };
  for (const side of ['s', 'n', 'w'] as const) {
    const m = side === 'w';
    // Jötunvörðr: 52×60, feet at (26, 56).
    const jotun = (k: string, thawed = false): Raster =>
      inked(grid(thawed ? JOTUN_THAW_PAL : JOTUN_PAL, key(JOTUNVORDR, `${side}_${k}`)));
    const j = (anim: string, i: number, r: Raster): void => {
      add(`enemy_jotunvordr_${anim}_${side}_${i}`, r, 26, 56, m);
    };
    j('idle', 0, jotun('idle'));
    j('walk', 0, jotun('walk0'));
    j('walk', 1, jotun('walk1'));
    j('raise', 0, jotun('raise'));
    j('stomp', 0, jotun('stomp'));
    j('thawed', 0, jotun('thawed', true));
    const k = (anim: string, i: number, pose: string): void => {
      add(`enemy_kolbeinn_${anim}_${side}_${i}`, seidmadr(side, pose), 20, 35, m);
    };
    k('idle', 0, 'idle');
    k('walk', 0, 'walk0');
    k('walk', 1, 'walk1');
    k('draw', 0, 'draw');
    k('strike', 0, 'strike');
    k('cast', 0, 'cast');
    k('reel', 0, 'reel');
    // Hrímnir: 76×84, feet at (38, 80).
    for (const pose of ['idle', 'roar', 'reach', 'inhale', 'breathe', 'open'] as const)
      add(
        `enemy_hrimnir_${pose}_${side}_0`,
        inked(grid(KING_PAL, key(HRIMNIR, `${side}_${pose}`))),
        38,
        80,
        m,
      );
  }
  // His hand, 40×28 at (20, 24), and his pillars, 36×52 at (18, 47): south only.
  const hand = (pose: string): Raster => {
    const text = key(HAND, pose);
    return pose === 'shadow' ? shadowed(grid(KING_PAL, text)) : inked(grid(KING_PAL, text));
  };
  for (const pose of ['shadow', 'sweep', 'struck'] as const)
    add(`enemy_hrimnir_hand_${pose}_s_0`, hand(pose), 20, 24, false);
  add('enemy_hrimnir_hand_idle_s_0', hand('shadow'), 20, 24, false);
  const pillar = (k: string): Raster => {
    const text = key(PILLAR, k);
    return k.startsWith('shadow') ? shadowed(grid(KING_PAL, text)) : inked(grid(KING_PAL, text));
  };
  add('enemy_rime_pillar_idle_s_0', pillar('shadow0'), 18, 47, false);
  for (let i = 0; i < 2; i++) {
    add(`enemy_rime_pillar_shadow_s_${i}`, pillar(`shadow${i}`), 18, 47, false);
    add(`enemy_rime_pillar_fall_s_${i}`, pillar(`fall${i}`), 18, 47, false);
  }
  add('enemy_rime_pillar_fallen_s_0', pillar('fallen'), 18, 47, false);
  return out;
}
