import { outline } from '@art/outline';
import { C } from '@art/palette';
import { hex, type Raster } from '@art/raster';
import { grid, type DrawnFrame } from '../lib/sprite';
import { BITER, BULB, ROTVAETTR, SPIKE } from './grids';
import { ROOT_PAL } from './palette';

/**
 * Rótarhellir's foes, all seen from the south only: the root-biter that rises out of torn earth to snap,
 * the rótvættr (a heart of roots that peels its bark open on a glowing core), the sap bulbs on their
 * stalks and the root spikes that erupt through the floor.
 */
const INK = hex(C.ink);
const draw = (text: string): Raster => outline(grid(ROOT_PAL, text), INK, 1);

export function caveFrames(): DrawnFrame[] {
  const out: DrawnFrame[] = [];
  const add = (art: string, anim: string, i: number, raster: Raster, ox: number, oy: number): void => {
    out.push({ name: `${art}_${anim}_s_${i}`, raster, pivot: { x: ox / raster.w, y: oy / raster.h } });
  };
  const biter = (anim: string, i: number, text: string): void => {
    add('enemy_root_biter', anim, i, draw(text), 14, 28);
  };
  biter('buried', 0, BITER.buried);
  biter('tell', 0, BITER.tell0);
  biter('tell', 1, BITER.tell1);
  biter('bite', 0, BITER.bite0);
  biter('bite', 1, BITER.bite1);
  biter('idle', 0, BITER.idle);
  biter('hurt', 0, BITER.hurt);
  biter('retract', 0, BITER.retract0);
  biter('retract', 1, BITER.retract1);
  const heart = (anim: string, i: number, text: string): void => {
    add('enemy_rotvaettr', anim, i, draw(text), 28, 49);
  };
  heart('idle', 0, ROTVAETTR.shut);
  heart('open', 0, ROTVAETTR.open);
  heart('open', 1, ROTVAETTR.open);
  heart('roar', 0, ROTVAETTR.roar0);
  heart('roar', 1, ROTVAETTR.roar1);
  BULB.forEach((text, i) => {
    add('enemy_rot_bulb', 'idle', i, draw(text), 10, 21);
  });
  const spike = (anim: string, i: number, text: string): void => {
    add('enemy_root_spike', anim, i, draw(text), 10, 29);
  };
  spike('tell', 0, SPIKE.tell0);
  spike('tell', 1, SPIKE.tell1);
  spike('erupt', 0, SPIKE.erupt0);
  spike('erupt', 1, SPIKE.erupt1);
  spike('sink', 0, SPIKE.sink);
  return out;
}
