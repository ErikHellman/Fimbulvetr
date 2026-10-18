import type { GridPalette } from '@art/grid';
import { C } from '@art/palette';

/**
 * Letters used in the hero grids. Light comes from the top-left: `l`, `y`, `v`, `n` are the lit tones,
 * `d`, `g`, `u`, `q`, `x` the shaded ones. `k` is ink, drawn by hand where a fold or a feature needs a line;
 * the outer outline is added by `outline()` once a frame is assembled.
 */
export const HERO_PAL: GridPalette = {
  '.': null,
  k: C.ink,
  f: C.skin,
  d: C.skinShade,
  l: C.skinLight,
  h: C.hair,
  g: C.hairShade,
  y: C.hairLight,
  t: C.tunic,
  u: C.tunicShade,
  v: C.tunicLight,
  b: C.belt,
  B: '#8a6a3c',
  G: C.shieldRim,
  p: C.pants,
  q: C.pantsShade,
  o: C.boot,
  n: C.bootLight,
  w: C.steel,
  x: C.steelShade,
  W: '#eef3f7',
  r: C.wood,
  R: C.shield,
  Q: C.shieldShade,
};
