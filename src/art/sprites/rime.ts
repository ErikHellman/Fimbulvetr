import type { Dir4 } from '@core/math/dir';
import type { AnimDef } from '../anims';
import { ellipse, line, rect } from '../draw';
import { createRaster, flipX, hex, type Raster, type Rgba } from '../raster';
import { wolf, type WolfPal } from './enemies';
import type { Side } from './people';
import type { SpriteFrame } from './types';

/** Hrímfjöll (M9): the ice wolf, the frost wisp and its rime bolt. */

const ICE_WOLF: WolfPal = {
  fur: hex('#c8d8e6'),
  shade: hex('#8ea6bc'),
  light: hex('#f0f6fa'),
  eye: hex('#58b8f0'),
  ruff: hex('#ffffff'),
};

const WISP_HALO: Rgba = [168, 216, 240, 110];
const WISP: Rgba = [196, 232, 250, 230];
const WISP_CORE: Rgba = [255, 255, 255, 255];
const SHARD = hex('#7ec4ec');

type WispPose = 'a' | 'b' | 'glow' | 'loose' | 'hurt';

/** The frost wisp, 24×32 with its shadow at (12, 30): a pale flame round a six-point crystal. */
function frostWisp(pose: WispPose): Raster {
  const r = createRaster(24, 32);
  ellipse(r, 12, 29, 3, 1, WISP_HALO);
  const bob = pose === 'b' ? 1 : 0;
  const big = pose === 'glow' ? 1.5 : pose === 'loose' ? 1.2 : 1;
  ellipse(r, 12, 14 + bob, 5 * big, 5 * big, WISP_HALO);
  ellipse(r, 12, 14 + bob, 3.4 * big, 3.4 * big, pose === 'hurt' ? WISP_HALO : WISP);
  // The crystal at its heart: a six-pointed star.
  line(r, 12, 10 + bob, 12, 18 + bob, SHARD);
  line(r, 9, 12 + bob, 15, 16 + bob, SHARD);
  line(r, 9, 16 + bob, 15, 12 + bob, SHARD);
  rect(r, 12, 14 + bob, 1, 1, WISP_CORE);
  if (pose === 'glow') {
    rect(r, 5, 13, 1, 1, WISP_CORE);
    rect(r, 18, 15, 1, 1, WISP_CORE);
    rect(r, 12, 5, 1, 1, WISP_CORE);
  }
  return r;
}

/** A rime bolt, 12×12 with its ground point at (6, 10): a pale shard with a frosty halo. */
function bolt(i: number): Raster {
  const r = createRaster(12, 12);
  ellipse(r, 6, 6, 4, 4, WISP_HALO);
  ellipse(r, 6, 6, 2.4, 2.4, WISP);
  rect(r, 5 + i, 5, 2, 2, WISP_CORE);
  line(r, 2, 6, 10, 6, SHARD);
  return r;
}

export function rimeFrames(): SpriteFrame[] {
  const out: SpriteFrame[] = [];
  const add = (
    art: string,
    anim: string,
    side: Side,
    i: number,
    raster: Raster,
    ox: number,
    oy: number,
  ): void => {
    out.push({ name: `${art}_${anim}_${side}_${i}`, raster, ox, oy });
    if (side === 'w')
      out.push({ name: `${art}_${anim}_e_${i}`, raster: flipX(raster), ox: raster.w - ox, oy });
  };
  for (const side of ['s', 'n', 'w'] as const) {
    const v = (anim: string, i: number, r: Raster): void => {
      add('enemy_isvargr', anim, side, i, r, 16, 30);
    };
    v('idle', 0, wolf(side, 0, 'stand', ICE_WOLF));
    v('hurt', 0, wolf(side, 2, 'stand', ICE_WOLF));
    for (let i = 0; i < 4; i++) v('walk', i, wolf(side, i, 'stand', ICE_WOLF));
    v('tell', 0, wolf(side, 0, 'crouch', ICE_WOLF));
    v('tell', 1, wolf(side, 2, 'crouch', ICE_WOLF));
    v('lunge', 0, wolf(side, 0, 'lunge', ICE_WOLF));
    v('lunge', 1, wolf(side, 2, 'lunge', ICE_WOLF));
    const f = (anim: string, i: number, r: Raster): void => {
      add('enemy_frostvaettr', anim, side, i, r, 12, 30);
    };
    f('idle', 0, frostWisp('a'));
    f('fly', 0, frostWisp('a'));
    f('fly', 1, frostWisp('b'));
    f('tell', 0, frostWisp('glow'));
    f('tell', 1, frostWisp('a'));
    f('loose', 0, frostWisp('loose'));
    f('hurt', 0, frostWisp('hurt'));
  }
  for (let i = 0; i < 2; i++) out.push({ name: `fx_bolt_fly_s_${i}`, raster: bolt(i), ox: 6, oy: 10 });
  return out;
}

const ALL: readonly Dir4[] = ['s', 'n', 'w', 'e'];
const a = (frames: number, fps: number, loop = true): AnimDef => ({ frames, fps, loop, dirs: ALL });

export const RIME_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  enemy_isvargr: { idle: a(1, 1), hurt: a(1, 1), walk: a(4, 8), tell: a(2, 8), lunge: a(2, 10) },
  enemy_frostvaettr: { idle: a(1, 1), fly: a(2, 4), tell: a(2, 12), loose: a(1, 1), hurt: a(1, 1) },
  fx_bolt: { fly: { frames: 2, fps: 10, loop: true, dirs: ['s'] } },
};
