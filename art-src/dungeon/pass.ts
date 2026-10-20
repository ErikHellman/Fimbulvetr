import { outline } from '@art/outline';
import { C } from '@art/palette';
import { createRaster, hex, setPixel, type Raster } from '@art/raster';
import { LOOKS } from '@art/sprites/people';
import type { Coat } from '../enemies/palette';
import { wolf, wolfRaw } from '../enemies/wolf';
import { blade } from '../hero/props';
import { mirror, paste, type DrawnFrame } from '../lib/sprite';
import { FORWARD, INK, PIVOT_32, Wight, type Side } from './wights';

/**
 * The pass and the lake: Styrr in his last duel (his own look from the villagers, with the wights' round
 * shield and a sword; both hands high for the heavy blow), and the nykr foal of Sævatn (the wolf in a
 * lake-green coat with a weed ruff, gliding under a ring of water, floundering on the bank).
 */

const STYRR_GEAR = { helm: false, shield: true, sword: true, bow: false };
const FOAL: Coat = {
  fur: '#5f7a72',
  shade: '#3a4f4a',
  light: '#8fb0a4',
  eye: '#e8f8f0',
  bone: '#d8d0c0',
  ruff: '#2f5a2a',
};

/** A ring on the water, swelling by `phase`. */
function ring(r: Raster, phase: number): void {
  const light = hex(C.waterLight);
  const shade = hex(C.waterShade);
  const rx = 7 + phase * 2;
  for (let x = -rx; x <= rx; x++) {
    const dy = Math.round(2.5 * Math.sqrt(Math.max(0, 1 - (x * x) / (rx * rx))));
    setPixel(r, 16 + x, 27 + dy, light);
    setPixel(r, 16 + x, 27 - dy, Math.abs(x) > rx - 3 ? light : shade);
  }
}

/** The foal under the surface: a dark shape gliding under a widening ring. */
function foalUnder(phase: number): Raster {
  const r = createRaster(32, 32);
  const dark = hex(C.waterShade);
  for (let y = 24; y <= 28; y++)
    for (let x = 9; x <= 23; x++) if ((x - 16) ** 2 / 49 + (y - 26) ** 2 / 6 <= 1) setPixel(r, x, y, dark);
  ring(r, phase);
  return r;
}

export function passFrames(): DrawnFrame[] {
  const out: DrawnFrame[] = [];
  const add = (art: string, anim: string, side: Side, i: number, raster: Raster): void => {
    out.push({ name: `${art}_${anim}_${side}_${i}`, raster, pivot: PIVOT_32 });
    if (side === 'w') out.push({ name: `${art}_${anim}_e_${i}`, raster: mirror(raster), pivot: PIVOT_32 });
  };
  const styrr = new Wight(LOOKS['styrr'], {});
  /** Both hands high, the blade laid back over the head: the heavy blow is coming. */
  const wind = (side: Side, step: number): Raster => {
    const r = styrr.figure(side, step, 'up', { ...STYRR_GEAR, sword: false });
    const prop = blade('sword', side === 'w' ? 'w' : 'e');
    paste(r, prop.raster, 10, 4 + (step % 2) - prop.hand.y);
    return outline(r, INK, 1);
  };
  for (const side of ['s', 'w', 'n'] as const) {
    const s = (anim: string, i: number, r: Raster): void => {
      add('enemy_styrr', anim, side, i, r);
    };
    s('idle', 0, styrr.pose(side, 0, 'down', STYRR_GEAR, 's'));
    for (let i = 0; i < 4; i++) s('walk', i, styrr.pose(side, i, 'down', STYRR_GEAR, 's'));
    s('tell', 0, styrr.pose(side, 0, 'up', STYRR_GEAR, 'n'));
    s('tell', 1, styrr.pose(side, 1, 'up', STYRR_GEAR, 'n'));
    s('cut', 0, styrr.pose(side, 0, 'forward', STYRR_GEAR, FORWARD[side]));
    s('wind', 0, wind(side, 0));
    s('wind', 1, wind(side, 1));
    s('heavy', 0, styrr.pose(side, 0, 'forward', { ...STYRR_GEAR, shield: false }, FORWARD[side]));
    s('hurt', 0, styrr.pose(side, 2, 'down', { ...STYRR_GEAR, shield: false }));

    const f = (anim: string, i: number, r: Raster): void => {
      add('enemy_nykr_foal', anim, side, i, r);
    };
    f('under', 0, foalUnder(0));
    f('under', 1, foalUnder(1));
    f('idle', 0, wolf(side, 0, 'stand', FOAL));
    f('hurt', 0, wolf(side, 2, 'stand', FOAL));
    for (let i = 0; i < 4; i++) f('walk', i, wolf(side, i, 'stand', FOAL));
    f('tell', 0, wolf(side, 0, 'howl', FOAL));
    f('tell', 1, wolf(side, 2, 'howl', FOAL));
    f('lunge', 0, wolf(side, 0, 'lunge', FOAL));
    f('lunge', 1, wolf(side, 2, 'lunge', FOAL));
    // Stranded on the bank: the foal crouched low, legs thrashing, in a ring of water.
    for (let i = 0; i < 2; i++) {
      const r = wolfRaw(side, i * 2, 'crouch', FOAL);
      ring(r, i);
      f('flounder', i, outline(r, INK, 1));
    }
  }
  return out;
}
