import type { AnimDef } from '../anims';
import { ellipse, line, rect } from '../draw';
import { outline } from '../outline';
import { C } from '../palette';
import { createRaster, hex, type Raster, type Rgba } from '../raster';
import type { SpriteFrame } from './types';

/** Hrímturn (M9b): its windows of rime-light, glass prisms and crystal eyes. */

const INK = hex(C.ink);
const FRAME = hex('#3e5672');
const FRAME_LIGHT = hex('#6c8cac');
const GLASS = hex('#b4dcf2');
const GLASS_LIGHT = hex('#f0faff');
const GLASS_DARK = hex('#6c9cbc');
const SHADOW: Rgba = [0, 0, 0, 80];

/** A window of rime-glass set in a rime pillar, 18×28: bright when its beam shines, dull when not. */
function window(on: boolean): Raster {
  const r = createRaster(18, 28);
  ellipse(r, 9, 25, 7, 2, SHADOW);
  rect(r, 3, 4, 12, 21, FRAME);
  rect(r, 3, 4, 2, 21, FRAME_LIGHT);
  rect(r, 6, 7, 6, 13, on ? GLASS_LIGHT : GLASS_DARK);
  rect(r, 7, 8, 4, 11, on ? GLASS : hex('#4c7494'));
  if (on) {
    rect(r, 8, 9, 2, 9, GLASS_LIGHT);
    line(r, 4, 2, 6, 5, GLASS_LIGHT);
    line(r, 13, 2, 11, 5, GLASS_LIGHT);
  }
  return outline(r, INK, 1);
}

/** A glass prism on a squat plinth, 18×24, its pane slanted `/` or `\`. */
function prism(slant: '/' | '\\'): Raster {
  const r = createRaster(18, 24);
  ellipse(r, 9, 21, 7, 2, SHADOW);
  rect(r, 3, 15, 12, 6, FRAME);
  rect(r, 3, 15, 12, 1, FRAME_LIGHT);
  const [x0, x1] = slant === '/' ? [3, 14] : [14, 3];
  for (let i = 0; i < 3; i++)
    line(r, x0 + (slant === '/' ? i : -i), 14, x1 + (slant === '/' ? i : -i), 3, GLASS);
  line(r, x0, 14, x1, 3, GLASS_LIGHT);
  return outline(r, INK, 1);
}

/** A crystal eye in a rime socket, 18×24: dark, or lit from within once a beam has reached it. */
function crystal(lit: boolean): Raster {
  const r = createRaster(18, 24);
  ellipse(r, 9, 21, 7, 2, SHADOW);
  rect(r, 3, 12, 12, 9, FRAME);
  rect(r, 3, 12, 12, 1, FRAME_LIGHT);
  ellipse(r, 9, 9, 5, 6, lit ? GLASS : GLASS_DARK);
  ellipse(r, 9, 9, 2.5, 3, lit ? GLASS_LIGHT : hex('#3a5a78'));
  if (lit) {
    rect(r, 8, 1, 2, 2, GLASS_LIGHT);
    rect(r, 1, 8, 2, 2, GLASS_LIGHT);
    rect(r, 15, 8, 2, 2, GLASS_LIGHT);
  }
  return outline(r, INK, 1);
}

export function towerFrames(): SpriteFrame[] {
  const out: SpriteFrame[] = [];
  const fixture = (name: string, raster: Raster): void => {
    out.push({ name, raster, ox: 9, oy: raster.h - 3 });
  };
  fixture('fix_window_on_s_0', window(true));
  fixture('fix_window_off_s_0', window(false));
  fixture('fix_prism_slash_s_0', prism('/'));
  fixture('fix_prism_back_s_0', prism('\\'));
  fixture('fix_crystal_lit_s_0', crystal(true));
  fixture('fix_crystal_dark_s_0', crystal(false));
  return out;
}

const one: AnimDef = { frames: 1, fps: 1, loop: true, dirs: ['s'] };

export const TOWER_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  fix_window: { on: one, off: one },
  fix_prism: { slash: one, back: one },
  fix_crystal: { lit: one, dark: one },
};
