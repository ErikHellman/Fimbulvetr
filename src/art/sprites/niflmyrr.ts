import type { Dir4 } from '@core/math/dir';
import type { AnimDef } from '../anims';
import { ellipse } from '../draw';
import { createRaster, flipX, setPixel, type Raster, type Rgba } from '../raster';
import { drawPerson, type Look, type Side } from './people';
import type { SpriteFrame } from './types';

/** Niflmýrr (M6a): what walks in the fog marsh. */

const MARA_LOOK: Look = {
  skin: '#8e9a98',
  hair: '#1e2228',
  hairStyle: 'long',
  top: '#3a3e44',
  legs: 'skirt',
  bottom: '#2a2d32',
};
const MARA_EYES = '#e8f0a0';

const FOG_LOOK: Look = {
  skin: '#a8b4bc',
  hair: '#d8dee2',
  hairStyle: 'bald',
  beard: '#c8ced2',
  top: '#4c5560',
  legs: 'pants',
  bottom: '#363d46',
};
const FOG_EYES = '#9fe8ff';

/** A faint swirl of mist on the ground: all that shows of something lying in wait. */
function swirl(phase: number): Raster {
  const r = createRaster(32, 32);
  const mist: Rgba = [200, 210, 214, 70];
  const dark: Rgba = [60, 66, 72, 60];
  ellipse(r, 16, 27, 9, 2.6, () => mist);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * 6.283 + phase * 0.8;
    // A curl winding outward from the middle.
    const x = Math.round(16 + Math.cos(a) * (3 + i * 0.6));
    const y = Math.round(25 + Math.sin(a) * (1 + i * 0.15));
    setPixel(r, x, y, dark);
  }
  return r;
}

/** A person sunk to `sink` rows in the mist, with a mist ring where it rises. */
function sunk(look: Look, side: Side, sink: number, eyes: string): Raster {
  const r = drawPerson(look, side, 0, { sink, eyes, arms: 'up' });
  ellipse(r, 16, 28, 10, 2.2, () => [200, 210, 214, 120]);
  return r;
}

/** A wisp ember hovering a hand above the mire: a pale green-gold flame with a white heart. */
function ember(bob: number): Raster {
  const r = createRaster(12, 16);
  const y = 6 - bob;
  ellipse(r, 6, y, 4.5, 5, () => [190, 230, 140, 90]);
  ellipse(r, 6, y, 3, 3.4, () => [214, 240, 150, 220]);
  ellipse(r, 6, y + 0.5, 1.4, 1.6, () => [250, 255, 230, 255]);
  // Its faint reflection on the wet ground.
  ellipse(r, 6, 14, 2.5, 0.8, () => [190, 230, 140, 70]);
  return r;
}

export function niflmyrrFrames(): SpriteFrame[] {
  const out: SpriteFrame[] = [];
  for (let i = 0; i < 2; i++)
    out.push({ name: `prop_wisp_ember_idle_s_${i}`, raster: ember(i), ox: 6, oy: 15 });
  const add = (art: string, anim: string, side: Side, i: number, raster: Raster): void => {
    out.push({ name: `${art}_${anim}_${side}_${i}`, raster, ox: 16, oy: 30 });
    if (side === 'w') out.push({ name: `${art}_${anim}_e_${i}`, raster: flipX(raster), ox: 16, oy: 30 });
  };
  for (const side of ['s', 'n', 'w'] as const) {
    const m = (anim: string, i: number, r: Raster): void => {
      add('enemy_mara', anim, side, i, r);
    };
    m('hide', 0, swirl(0));
    m('hide', 1, swirl(1));
    m('idle', 0, drawPerson(MARA_LOOK, side, 0, { eyes: MARA_EYES }));
    m('tell', 0, drawPerson(MARA_LOOK, side, 0, { eyes: MARA_EYES, arms: 'up', sink: 4 }));
    m('tell', 1, drawPerson(MARA_LOOK, side, 1, { eyes: MARA_EYES, arms: 'up', sink: 5 }));
    m('leap', 0, drawPerson(MARA_LOOK, side, 1, { eyes: MARA_EYES, arms: 'forward' }));
    m('ride', 0, drawPerson(MARA_LOOK, side, 0, { eyes: MARA_EYES, arms: 'forward', sink: 10 }));
    m('ride', 1, drawPerson(MARA_LOOK, side, 2, { eyes: MARA_EYES, arms: 'forward', sink: 11 }));
    m('down', 0, sunk(MARA_LOOK, side, 16, MARA_EYES));
    m('hurt', 0, drawPerson(MARA_LOOK, side, 2, { eyes: MARA_EYES }));

    const f = (anim: string, i: number, r: Raster): void => {
      add('enemy_fog_draugr', anim, side, i, r);
    };
    f('hide', 0, swirl(0));
    f('hide', 1, swirl(1));
    [22, 16, 10, 4].forEach((sink, i) => {
      f('rise', i, sunk(FOG_LOOK, side, sink, FOG_EYES));
    });
    f('idle', 0, drawPerson(FOG_LOOK, side, 0, { eyes: FOG_EYES }));
    for (let i = 0; i < 4; i++) f('walk', i, drawPerson(FOG_LOOK, side, i, { eyes: FOG_EYES }));
    f('tell', 0, drawPerson(FOG_LOOK, side, 0, { eyes: FOG_EYES, arms: 'up' }));
    f('tell', 1, drawPerson(FOG_LOOK, side, 1, { eyes: FOG_EYES, arms: 'up' }));
    f('swing', 0, drawPerson(FOG_LOOK, side, 0, { eyes: FOG_EYES, arms: 'forward' }));
    f('swing', 1, drawPerson(FOG_LOOK, side, 2, { eyes: FOG_EYES, arms: 'forward' }));
    f('hurt', 0, drawPerson(FOG_LOOK, side, 2, { eyes: FOG_EYES }));
  }
  return out;
}

const ALL: readonly Dir4[] = ['s', 'n', 'w', 'e'];
const a = (frames: number, fps: number, loop = true): AnimDef => ({ frames, fps, loop, dirs: ALL });

export const NIFLMYRR_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  prop_wisp_ember: { idle: { frames: 2, fps: 3, loop: true, dirs: ['s'] } },
  enemy_mara: {
    hide: a(2, 2),
    idle: a(1, 1),
    tell: a(2, 10),
    leap: a(1, 1),
    ride: a(2, 6),
    down: a(1, 1),
    hurt: a(1, 1),
  },
  enemy_fog_draugr: {
    hide: a(2, 2),
    rise: a(4, 8, false),
    idle: a(1, 1),
    walk: a(4, 5),
    tell: a(2, 6),
    swing: a(2, 12, false),
    hurt: a(1, 1),
  },
};
