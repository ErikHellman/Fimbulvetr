import { ellipse } from '@art/draw';
import { createRaster, setPixel, type Raster, type Rgba } from '@art/raster';
import type { Look } from '@art/sprites/people';
import { grid, mirror, type DrawnFrame } from '../lib/sprite';
import { TAIL } from './grids2';
import { TAIL_PAL } from './palette';
import { NO_GEAR, PIVOT_32, Wight, type Side } from './wights';

/**
 * Niflmýrr's foes on the villagers' body: the mara (a dark woman with yellow eyes who hides as a swirl of
 * mist, leaps and rides), the fog-draugr (bald and bearded, rising out of the mist) and the marbendill
 * (grey as a drowned man, lake-weed for hair, a scaled tail for legs).
 */

const MARA_LOOK: Look = {
  skin: '#8e9a98',
  hair: '#1e2228',
  hairStyle: 'long',
  top: '#3a3e44',
  legs: 'skirt',
  bottom: '#2a2d32',
};
const FOG_LOOK: Look = {
  skin: '#a8b4bc',
  hair: '#d8dee2',
  hairStyle: 'bald',
  beard: '#c8ced2',
  top: '#4c5560',
  legs: 'pants',
  bottom: '#363d46',
};
const MARBENDILL_LOOK: Look = {
  skin: '#7f948c',
  hair: '#2f5a3a',
  hairStyle: 'long',
  beard: '#2f5a3a',
  top: '#5f7a70',
  legs: 'pants',
  bottom: '#46685e',
};

/** A faint swirl of mist on the ground: all that shows of something lying in wait. */
function swirl(phase: number): Raster {
  const r = createRaster(32, 32);
  const mist: Rgba = [200, 210, 214, 70];
  const dark: Rgba = [60, 66, 72, 60];
  ellipse(r, 16, 27, 9, 2.6, () => mist);
  // A curl winding outward from the middle, step by step (no trig: a hand-laid spiral).
  const curl: readonly (readonly [number, number])[] = [
    [16, 25],
    [18, 25],
    [19, 26],
    [18, 27],
    [15, 27],
    [13, 26],
    [13, 24],
    [16, 23],
    [20, 23],
    [23, 25],
    [22, 28],
    [17, 29],
    [11, 28],
    [9, 25],
  ];
  curl.forEach(([x, y], i) => {
    if ((i + phase) % 2 === 0) setPixel(r, x, y, dark);
  });
  return r;
}

export function niflmyrrFrames(): DrawnFrame[] {
  const out: DrawnFrame[] = [];
  const add = (art: string, anim: string, side: Side, i: number, raster: Raster): void => {
    out.push({ name: `${art}_${anim}_${side}_${i}`, raster, pivot: PIVOT_32 });
    if (side === 'w') out.push({ name: `${art}_${anim}_e_${i}`, raster: mirror(raster), pivot: PIVOT_32 });
  };
  const mara = new Wight(MARA_LOOK, { eyes: '#e8f0a0', rise: 'mist' });
  const fog = new Wight(FOG_LOOK, { eyes: '#9fe8ff', rise: 'mist' });
  const tail = { s: grid(TAIL_PAL, TAIL.s), w: grid(TAIL_PAL, TAIL.w), n: grid(TAIL_PAL, TAIL.n) };
  const merman = new Wight(MARBENDILL_LOOK, { eyes: '#d8f0e0', rise: 'mist', tail });
  const swirls = [swirl(0), swirl(1)];
  for (const side of ['s', 'w', 'n'] as const) {
    const m = (anim: string, i: number, r: Raster): void => {
      add('enemy_mara', anim, side, i, r);
    };
    m('hide', 0, swirls[0] ?? createRaster(32, 32));
    m('hide', 1, swirls[1] ?? createRaster(32, 32));
    m('idle', 0, mara.pose(side, 0, 'down', NO_GEAR));
    m('tell', 0, mara.risen(side, 4, NO_GEAR, 'up', 0));
    m('tell', 1, mara.risen(side, 5, NO_GEAR, 'up', 1));
    m('leap', 0, mara.pose(side, 1, 'forward', NO_GEAR));
    m('ride', 0, mara.risen(side, 10, NO_GEAR, 'forward', 0));
    m('ride', 1, mara.risen(side, 11, NO_GEAR, 'forward', 2));
    m('down', 0, mara.risen(side, 16, NO_GEAR));
    m('hurt', 0, mara.pose(side, 2, 'down', NO_GEAR));

    const f = (anim: string, i: number, r: Raster): void => {
      add('enemy_fog_draugr', anim, side, i, r);
    };
    f('hide', 0, swirls[0] ?? createRaster(32, 32));
    f('hide', 1, swirls[1] ?? createRaster(32, 32));
    [22, 16, 10, 4].forEach((sink, i) => {
      f('rise', i, fog.risen(side, sink, NO_GEAR));
    });
    f('idle', 0, fog.pose(side, 0, 'down', NO_GEAR));
    for (let i = 0; i < 4; i++) f('walk', i, fog.pose(side, i, 'down', NO_GEAR));
    f('tell', 0, fog.pose(side, 0, 'up', NO_GEAR));
    f('tell', 1, fog.pose(side, 1, 'up', NO_GEAR));
    f('swing', 0, fog.pose(side, 0, 'forward', NO_GEAR));
    f('swing', 1, fog.pose(side, 2, 'forward', NO_GEAR));
    f('hurt', 0, fog.pose(side, 2, 'down', NO_GEAR));

    const b = (anim: string, i: number, r: Raster): void => {
      add('enemy_marbendill', anim, side, i, r);
    };
    [20, 14, 8, 3].forEach((sink, i) => {
      b('rise', i, merman.risen(side, sink, NO_GEAR));
    });
    b('idle', 0, merman.pose(side, 0, 'down', NO_GEAR));
    for (let i = 0; i < 4; i++) b('walk', i, merman.pose(side, i, 'down', NO_GEAR));
    b('tell', 0, merman.risen(side, 2, NO_GEAR, 'forward', 0));
    b('tell', 1, merman.risen(side, 3, NO_GEAR, 'forward', 1));
    b('grab', 0, merman.pose(side, 1, 'forward', NO_GEAR));
    b('grab', 1, merman.pose(side, 3, 'up', NO_GEAR));
    b('hurt', 0, merman.pose(side, 2, 'down', NO_GEAR));
  }
  return out;
}
