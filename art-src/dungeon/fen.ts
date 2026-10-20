import { outline } from '@art/outline';
import { C } from '@art/palette';
import { getPixel, hex, setPixel, type Raster } from '@art/raster';
import { grid, mirror, type DrawnFrame } from '../lib/sprite';
import { VATNORMR, WISP } from './grids';
import { WISP_PAL, WORM_PAL } from './palette';

/**
 * Mýrland's creatures: the water-worm (vatnormr) rearing out of its pool, and the bog-light (myrljós),
 * a cold flame over its reflection. The worm is drawn from the south, north and west (east mirrored);
 * the bog-light looks the same from every side.
 */
const INK = hex(C.ink);

/** The halo and the reflection turned translucent. */
function soften(src: Raster): Raster {
  const halo = hex('#5fb89a');
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const p = getPixel(src, x, y);
      if (p[3] > 0 && p[0] === halo[0] && p[1] === halo[1] && p[2] === halo[2])
        setPixel(src, x, y, [p[0], p[1], p[2], y > 26 ? 96 : 140]);
    }
  return src;
}

export function fenFrames(): DrawnFrame[] {
  const out: DrawnFrame[] = [];
  const add = (name: string, raster: Raster, ox: number, oy: number, mirrored: boolean): void => {
    const pivot = { x: ox / raster.w, y: oy / raster.h };
    out.push({ name, raster, pivot });
    if (mirrored) out.push({ name: name.replace(/_w_(\d+)$/, '_e_$1'), raster: mirror(raster), pivot });
  };
  const wisps = Object.fromEntries(
    Object.entries(WISP).map(([pose, text]) => [pose, soften(grid(WISP_PAL, text))]),
  );
  const wisp = (pose: string): Raster => {
    const r = wisps[pose];
    if (r === undefined) throw new Error(`no wisp pose ${pose}`);
    return r;
  };
  for (const side of ['s', 'n', 'w'] as const) {
    const worm = (anim: string, pose: 'under' | 'rear' | 'up' | 'sink'): void => {
      const raster = outline(grid(WORM_PAL, VATNORMR[`${side}_${pose}`]), INK, 1);
      add(`enemy_vatnormr_${anim}_${side}_0`, raster, 16, 28, side === 'w');
    };
    worm('under', 'under');
    worm('idle', 'under');
    worm('tell', 'rear');
    worm('up', 'up');
    worm('sink', 'sink');
    worm('hurt', 'up');
    const light = (anim: string, i: number, pose: string): void => {
      add(`enemy_myrljos_${anim}_${side}_${i}`, wisp(pose), 12, 30, side === 'w');
    };
    light('idle', 0, 'a');
    light('fly', 0, 'a');
    light('fly', 1, 'b');
    light('fade', 0, 'faded');
    light('tell', 0, 'flare');
    light('tell', 1, 'a');
    light('dart', 0, 'dart');
    light('hurt', 0, 'faded');
  }
  return out;
}
