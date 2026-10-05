import type { AnimDef } from '../anims';
import { ellipse, line, rect } from '../draw';
import { outline } from '../outline';
import { C } from '../palette';
import { createRaster, flipX, hex, type Raster, type Rgba } from '../raster';
import type { SpriteFrame } from './types';

/** Hrímturn (M9b): its windows of rime-light, glass prisms and crystal eyes; Svellr, Hrímgerðr and her icicles. */

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

// ── Svellr, the glacier construct: 44×40, its feet at (22, 38) ────────────────────────────────────────

const PACK = hex('#9cc4dc');
const PACK_LIGHT = hex('#d4ecf8');
const PACK_DARK = hex('#5c86a4');
const CRACK = hex('#24405a');
const EYE = hex('#3cc8ff');

type SvellrPose = 'idle' | 'scrape' | 'charge' | 'stunned';

/** A hunched hulk of packed glacier ice on four stumps, a ridge of shards down its back. */
function svellr(side: 's' | 'n' | 'w', pose: SvellrPose, phase: number): Raster {
  const r = createRaster(44, 40);
  ellipse(r, 22, 36, 14, 2, SHADOW);
  const lean = pose === 'charge' ? 2 : 0;
  const dip = pose === 'scrape' ? phase : pose === 'stunned' ? 2 : 0;
  for (const x of [9, 16, 26, 33]) rect(r, x - 1, 29, 4, 7, PACK_DARK);
  ellipse(r, 22, 21 + dip, 15, 10, PACK);
  ellipse(r, 22, 18 + dip, 12, 6, PACK_LIGHT);
  // Shards along its back.
  for (const x of [12, 18, 24, 30]) line(r, x, 12 + dip, x + 2, 6 + dip + (x % 3), PACK_LIGHT);
  if (side !== 'n') {
    const cx = side === 's' ? 22 : 9 + lean;
    rect(r, cx - 4, 22 + dip, 3, 2, pose === 'stunned' ? CRACK : EYE);
    rect(r, cx + 2, 22 + dip, 3, 2, pose === 'stunned' ? CRACK : EYE);
  }
  if (pose === 'scrape') line(r, 6, 34, 14 + 4 * phase, 34, PACK_LIGHT);
  if (pose === 'stunned') {
    line(r, 14, 14, 20, 26, CRACK);
    line(r, 28, 15, 24, 27, CRACK);
  }
  return outline(r, INK, 1);
}

// ── Hrímgerðr, the Glass: 40×62, her feet at (20, 60) ─────────────────────────────────────────────────

const RIME_SKIN = hex('#dceef8');
const RIME_SHADE = hex('#9cbcd4');
const GOWN = hex('#6c98bc');
const GOWN_DARK = hex('#3c6488');
const HAIR = hex('#f4fbff');
const CROWN = hex('#7edcff');
const HAND_GLOW: Rgba = [180, 236, 255, 220];

type GiantessPose = 'idle' | 'roar' | 'cast' | 'loose' | 'kneel';

/** A giantess of rime in a long gown of ice, a crown of shards, her hair a frozen fall. */
function hrimgerdr(side: 's' | 'n' | 'w', pose: GiantessPose, phase: number): Raster {
  const r = createRaster(40, 62);
  ellipse(r, 20, 58, 12, 2, SHADOW);
  const k = pose === 'kneel' ? 12 : 0;
  // The gown, wide at the hem.
  for (let y = 26 + k; y < 58; y++) {
    const half = 6 + Math.floor((y - 26 - k) / 3);
    rect(r, 20 - half, y, half * 2, 1, y > 50 ? GOWN_DARK : GOWN);
  }
  // Body and head.
  rect(r, 14, 16 + k, 12, 12, RIME_SHADE);
  rect(r, 15, 16 + k, 10, 11, GOWN);
  ellipse(r, 20, 11 + k, 5, 5.5, side === 'n' ? HAIR : RIME_SKIN);
  rect(r, 14, 9 + k, 2, 16, HAIR);
  rect(r, 24, 9 + k, 2, 16, HAIR);
  for (const x of [15, 18, 21, 24]) line(r, x, 6 + k, x + 1, 3 + k, CROWN);
  if (side === 's') {
    rect(r, 17, 11 + k, 2, 1, CROWN);
    rect(r, 21, 11 + k, 2, 1, CROWN);
  } else if (side === 'w') rect(r, 16, 11 + k, 2, 1, CROWN);
  // Arms: down at rest, one raised to cast, both flung wide in a roar.
  const raised = pose === 'cast' || pose === 'loose';
  const wide = pose === 'roar';
  rect(r, wide ? 6 : 10, wide ? 14 + k : 18 + k, 4, wide ? 4 : 12, RIME_SKIN);
  rect(
    r,
    raised || wide ? 30 : 26,
    raised ? 8 + k : wide ? 14 + k : 18 + k,
    4,
    raised ? 12 : wide ? 4 : 12,
    RIME_SKIN,
  );
  if (raised) {
    const glow = pose === 'loose' ? 4 : 2 + phase;
    ellipse(r, 32, 7 + k, glow, glow, HAND_GLOW);
    rect(r, 31, 6 + k, 2, 2, GLASS_LIGHT);
  }
  if (pose === 'kneel') line(r, 12, 40, 28, 40, RIME_SHADE);
  return outline(r, INK, 1);
}

// ── An icicle: 24×44, its ground point at (12, 41) ─────────────────────────────────────────────────────

type IciclePose = 'shadow' | 'fall' | 'shatter';

function icicle(pose: IciclePose, phase: number): Raster {
  const r = createRaster(24, 44);
  if (pose === 'shadow') {
    ellipse(r, 12, 39, 6 + 3 * phase, 2 + phase, SHADOW);
    return r;
  }
  if (pose === 'fall') {
    ellipse(r, 12, 40, 8, 2, SHADOW);
    const y = phase === 0 ? 4 : 18;
    for (let i = 0; i < 18; i++) {
      const half = Math.max(0, 3 - Math.floor(i / 6));
      rect(r, 12 - half, y + i, half * 2 + 1, 1, i % 5 === 0 ? GLASS_LIGHT : GLASS);
    }
    return outline(r, INK, 1);
  }
  for (const [x, y] of [
    [6, 38],
    [10, 35],
    [15, 37],
    [18, 39],
    [8, 40],
  ] as const)
    rect(r, x, y, 2 + phase, 2, phase === 0 ? GLASS_LIGHT : GLASS);
  return outline(r, INK, 1);
}

export function towerFoeFrames(): SpriteFrame[] {
  const out: SpriteFrame[] = [];
  const add = (
    art: string,
    anim: string,
    side: 's' | 'n' | 'w',
    i: number,
    raster: Raster,
    ox: number,
    oy: number,
  ): void => {
    out.push({ name: `${art}_${anim}_${side}_${String(i)}`, raster, ox, oy });
    if (side === 'w')
      out.push({ name: `${art}_${anim}_e_${String(i)}`, raster: flipX(raster), ox: raster.w - ox, oy });
  };
  for (const side of ['s', 'n', 'w'] as const) {
    const sv = (anim: string, i: number, r: Raster): void => {
      add('enemy_svellr', anim, side, i, r, 22, 38);
    };
    sv('idle', 0, svellr(side, 'idle', 0));
    sv('scrape', 0, svellr(side, 'scrape', 0));
    sv('scrape', 1, svellr(side, 'scrape', 1));
    sv('charge', 0, svellr(side, 'charge', 0));
    sv('stunned', 0, svellr(side, 'stunned', 0));
    const hg = (anim: string, i: number, r: Raster): void => {
      add('enemy_hrimgerdr', anim, side, i, r, 20, 60);
    };
    hg('idle', 0, hrimgerdr(side, 'idle', 0));
    hg('roar', 0, hrimgerdr(side, 'roar', 0));
    hg('cast', 0, hrimgerdr(side, 'cast', 0));
    hg('cast', 1, hrimgerdr(side, 'cast', 1));
    hg('loose', 0, hrimgerdr(side, 'loose', 0));
    hg('kneel', 0, hrimgerdr(side, 'kneel', 0));
  }
  out.push({ name: 'enemy_icicle_shadow_s_0', raster: icicle('shadow', 0), ox: 12, oy: 41 });
  out.push({ name: 'enemy_icicle_shadow_s_1', raster: icicle('shadow', 1), ox: 12, oy: 41 });
  out.push({ name: 'enemy_icicle_fall_s_0', raster: icicle('fall', 0), ox: 12, oy: 41 });
  out.push({ name: 'enemy_icicle_fall_s_1', raster: icicle('fall', 1), ox: 12, oy: 41 });
  out.push({ name: 'enemy_icicle_shatter_s_0', raster: icicle('shatter', 0), ox: 12, oy: 41 });
  out.push({ name: 'enemy_icicle_shatter_s_1', raster: icicle('shatter', 1), ox: 12, oy: 41 });
  return out;
}

const one: AnimDef = { frames: 1, fps: 1, loop: true, dirs: ['s'] };
const all = (frames: number, fps: number): AnimDef => ({
  frames,
  fps,
  loop: true,
  dirs: ['s', 'n', 'w', 'e'],
});
const south = (frames: number, fps: number, loop = true): AnimDef => ({ frames, fps, loop, dirs: ['s'] });

export const TOWER_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  fix_window: { on: one, off: one },
  fix_prism: { slash: one, back: one },
  fix_crystal: { lit: one, dark: one },
  enemy_svellr: { idle: all(1, 1), scrape: all(2, 8), charge: all(1, 1), stunned: all(1, 1) },
  enemy_hrimgerdr: { idle: all(1, 1), roar: all(1, 1), cast: all(2, 6), loose: all(1, 1), kneel: all(1, 1) },
  enemy_icicle: { shadow: south(2, 3), fall: south(2, 12, false), shatter: south(2, 10, false) },
};
