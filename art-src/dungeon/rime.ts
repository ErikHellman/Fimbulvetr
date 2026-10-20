import type { Raster } from '@art/raster';
import type { Coat } from '../enemies/palette';
import { wolfFrames } from '../enemies/wolf';
import { grid, mirror, type DrawnFrame } from '../lib/sprite';
import { softened } from './fx';
import { FROST } from './grids3';
import { FROST_PAL } from './palette';

/** Ísvargr, the ice wolf: the wolf in a coat of rime with eyes of cold blue. */
const ICE: Coat = {
  fur: '#c8d8e6',
  shade: '#8ea6bc',
  light: '#f0f6fa',
  eye: '#58b8f0',
  bone: '#ffffff',
  ruff: '#ffffff',
};

/** Hrímfjöll's foes: the ice wolf and the frost wisp, a pale flame round a six-point crystal. */
export function rimeFoeFrames(): DrawnFrame[] {
  const out: DrawnFrame[] = wolfFrames('enemy_isvargr', ICE, false);
  const wisps = Object.fromEntries(
    Object.entries(FROST).map(([pose, text]) => [pose, softened(grid(FROST_PAL, text), '#a8d8f0')]),
  );
  const wisp = (pose: string): Raster => {
    const r = wisps[pose];
    if (r === undefined) throw new Error(`no frost wisp pose ${pose}`);
    return r;
  };
  const pivot = { x: 0.5, y: 30 / 32 };
  for (const side of ['s', 'n', 'w'] as const) {
    const f = (anim: string, i: number, pose: string): void => {
      const raster = wisp(pose);
      out.push({ name: `enemy_frostvaettr_${anim}_${side}_${i}`, raster, pivot });
      if (side === 'w') out.push({ name: `enemy_frostvaettr_${anim}_e_${i}`, raster: mirror(raster), pivot });
    };
    f('idle', 0, 'a');
    f('fly', 0, 'a');
    f('fly', 1, 'b');
    f('tell', 0, 'glow');
    f('tell', 1, 'a');
    f('loose', 0, 'loose');
    f('hurt', 0, 'hurt');
  }
  return out;
}
