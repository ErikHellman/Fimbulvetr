import type { Dir4 } from '@core/math/dir';
import type { AnimDef } from '../anims';
import { ellipse, line, rect } from '../draw';
import { outline } from '../outline';
import { C } from '../palette';
import { blit, createRaster, flipX, hex, setPixel, type Raster, type Rgba } from '../raster';
import { wolf, type WolfPal, type WolfPose } from './enemies';
import { grow } from './haugar';
import { drawPerson, type Look, type Side } from './people';
import type { SpriteFrame } from './types';

const INK = hex(C.ink);

/** Helgrind (M6b): the grapple chain and its posts, and what stands in Hel's gate. */

const IRON = hex('#4a4f58');
const IRON_LIGHT = hex('#8a929e');
const IRON_DARK = hex('#23262c');
const STONE = hex('#2e2f36');
const STONE_LIGHT = hex('#4a4b55');
const STONE_DARK = hex('#1a1b20');

/** A grapple post: a squat black-stone pillar bound in iron, with a ring on top for the hook. */
function post(): Raster {
  const r = createRaster(18, 28);
  ellipse(r, 9, 25, 7, 2, () => [0, 0, 0, 90]);
  rect(r, 4, 9, 10, 16, STONE_DARK);
  rect(r, 4, 9, 8, 16, STONE);
  rect(r, 4, 9, 2, 16, STONE_LIGHT);
  // Two iron bands.
  rect(r, 3, 12, 12, 2, IRON);
  rect(r, 3, 12, 12, 1, IRON_LIGHT);
  rect(r, 3, 20, 12, 2, IRON);
  rect(r, 3, 20, 12, 1, IRON_LIGHT);
  // The cap and its ring.
  rect(r, 3, 7, 12, 3, IRON_DARK);
  rect(r, 3, 7, 12, 1, IRON);
  ellipse(r, 9, 4, 3.2, 3.2, (x, y) => ((x - 9) ** 2 + (y - 4) ** 2 > 3.5 ? IRON_LIGHT : STONE_DARK));
  return r;
}

/** The chain's head, a three-pronged hook, pointing east (the other ways are turned from it). */
function hookEast(): Raster {
  const r = createRaster(14, 14);
  rect(r, 1, 6, 6, 2, IRON);
  rect(r, 1, 6, 6, 1, IRON_LIGHT);
  line(r, 7, 7, 11, 3, IRON_LIGHT);
  line(r, 7, 7, 12, 7, IRON_LIGHT);
  line(r, 7, 7, 11, 11, IRON);
  return outline(r, INK, 1);
}

/** Turns a square raster a quarter round, clockwise. */
function turn(src: Raster): Raster {
  const r = createRaster(src.h, src.w);
  for (let y = 0; y < src.h; y++)
    for (let x = 0; x < src.w; x++) {
      const i = (y * src.w + x) * 4;
      const c: Rgba = [src.data[i] ?? 0, src.data[i + 1] ?? 0, src.data[i + 2] ?? 0, src.data[i + 3] ?? 0];
      if (c[3] !== 0) setPixel(r, src.h - 1 - y, x, c);
    }
  return r;
}

/** One link of the chain: a small iron ring. */
function link(): Raster {
  const r = createRaster(6, 6);
  rect(r, 0, 0, 6, 6, IRON);
  rect(r, 0, 0, 6, 1, IRON_LIGHT);
  rect(r, 0, 5, 6, 1, IRON_DARK);
  rect(r, 2, 2, 2, 2, [0, 0, 0, 0]);
  return r;
}

const PLANK = hex('#5a4632');
const PLANK_LIGHT = hex('#7a6246');
const PLANK_DARK = hex('#3a2c1e');
const ROPE = hex('#a89a72');

/** A raft of black-tarred planks lashed across two logs, 2×2 tiles, with a pixel of clear margin. */
export function raft(): Raster {
  const r = createRaster(34, 34);
  rect(r, 2, 4, 30, 27, PLANK_DARK);
  for (let i = 0; i < 6; i++) {
    const y = 5 + i * 4;
    rect(r, 3, y, 28, 3, PLANK);
    rect(r, 3, y, 28, 1, PLANK_LIGHT);
  }
  // The lashings.
  for (const x of [6, 26]) {
    rect(r, x, 4, 2, 27, ROPE);
    rect(r, x + 1, 4, 1, 27, PLANK_DARK);
  }
  rect(r, 2, 31, 30, 1, [20, 24, 30, 140]);
  return r;
}

// ── Hel-hounds and Garmr ─────────────────────────────────────────────────────────────────────────────

const HELHOUND: WolfPal = {
  fur: hex('#2a2426'),
  shade: hex('#16120f'),
  light: hex('#4a3e3a'),
  eye: hex('#ff5a20'),
};

const GARMR: WolfPal = {
  fur: hex('#3a2a26'),
  shade: hex('#1e1412'),
  light: hex('#6a4a40'),
  eye: hex('#ffb030'),
  ruff: hex('#7a2a20'),
};

/** A copy of a rectangle of `src`. */
function crop(src: Raster, x: number, y: number, w: number, h: number): Raster {
  const r = createRaster(w, h);
  for (let yy = 0; yy < h; yy++)
    for (let xx = 0; xx < w; xx++) {
      const i = ((y + yy) * src.w + x + xx) * 4;
      const c: Rgba = [src.data[i] ?? 0, src.data[i + 1] ?? 0, src.data[i + 2] ?? 0, src.data[i + 3] ?? 0];
      if (c[3] !== 0) setPixel(r, xx, yy, c);
    }
  return r;
}

/** Where a grown (48×48) wolf's head sits, by side: the rectangle copied for Garmr's other two heads. */
const HEAD: Readonly<Record<Side, readonly [number, number, number, number]>> = {
  w: [1, 12, 21, 22],
  s: [13, 8, 22, 26],
  n: [15, 5, 20, 22],
};
/** Where the two extra heads go, relative to the first: one behind (drawn first), one in front. */
const HEADS: Readonly<Record<Side, readonly [readonly [number, number], readonly [number, number]]>> = {
  w: [
    [5, -7],
    [3, 6],
  ],
  s: [
    [-11, -3],
    [11, -3],
  ],
  n: [
    [-10, 2],
    [10, 2],
  ],
};

/** Garmr: the hound grown half again, with three heads and an iron collar ring. 48×54, feet at (24, 49). */
function garmr(side: Side, phase: number, pose: WolfPose): Raster {
  const body = grow(wolf(side, phase, pose, GARMR));
  const [hx, hy, hw, hh] = HEAD[side];
  const head = crop(body, hx, hy, hw, hh);
  const [back, front] = HEADS[side];
  const r = createRaster(48, 54);
  const top = 4;
  blit(r, head, hx + back[0], hy + back[1] + top);
  if (side !== 's') blit(r, head, hx + front[0], hy + front[1] + top);
  blit(r, body, 0, top);
  if (side === 's') blit(r, head, hx + front[0], hy + front[1] + top);
  // The collar and its ring, where the grapple bites.
  const ring = hex('#a8b0bc');
  const cx = side === 'w' ? 18 : 24;
  const cy = (side === 'w' ? 34 : 36) + top;
  ellipse(r, cx, cy, 2.5, 2.5, () => ring);
  ellipse(r, cx, cy, 1, 1, () => INK);
  return r;
}

// ── Náströnd, the Hollow ──────────────────────────────────────────────────────────────────────────────

const HOLLOW_LOOK: Look = {
  skin: '#7c8a8e',
  hair: '#1a1c22',
  hairStyle: 'long',
  beard: '#2a2e36',
  top: '#2c3440',
  legs: 'pants',
  bottom: '#1c2028',
};
const HOLLOW_EYES = '#7ff0ff';
const SHIELD = hex('#3a3026');
const SHIELD_RIM = hex('#7a828e');
const SHIELD_BOSS = hex('#c8ccd4');
const FLAIL = hex('#5a606a');

/** The tower shield, standing: dark planks, an iron rim and boss. */
function towerShield(r: Raster, x: number, y: number, w: number, h: number): void {
  rect(r, x, y, w, h, SHIELD_RIM);
  rect(r, x + 1, y + 1, w - 2, h - 2, SHIELD);
  for (let yy = y + 4; yy < y + h - 2; yy += 4) rect(r, x + 1, yy, w - 2, 1, hex('#2a2219'));
  ellipse(r, x + w / 2, y + h / 2, 1.5, 1.5, () => SHIELD_BOSS);
}

type HollowPose = 'rest' | 'raise' | 'cut' | 'flail';

/** Náströnd: a gaunt draugr lord grown half again, with a tower shield (unless `bare`). 48×54, feet (24, 51). */
function hollow(side: Side, phase: number, pose: HollowPose, bare: boolean): Raster {
  const arms = pose === 'raise' || pose === 'flail' ? 'up' : pose === 'cut' ? 'forward' : 'down';
  const base = drawPerson(HOLLOW_LOOK, side, phase, { eyes: HOLLOW_EYES, arms });
  const r = createRaster(48, 54);
  blit(r, grow(base), 0, 6);
  if (pose === 'flail') {
    // The chain-flail whirling over his head.
    line(r, 24, 14, 40, 6, FLAIL);
    line(r, 24, 14, 8, 6, FLAIL);
    ellipse(r, 41, 6, 3, 3, () => FLAIL);
    ellipse(r, 7, 6, 3, 3, () => FLAIL);
  } else if (pose === 'cut') {
    if (side === 'w') rect(r, 2, 32, 14, 3, hex(C.steel));
    else rect(r, 33, 30, 3, 12, hex(C.steel));
  }
  if (!bare) {
    if (side === 's') towerShield(r, 6, 22, 14, 26);
    else if (side === 'w') towerShield(r, 4, 20, 10, 28);
    else towerShield(r, 30, 22, 12, 24);
  }
  return outline(r, INK, 1);
}

/** The tower shield lying where it fell. 24×20, its middle at (12, 16). */
function shieldDown(): Raster {
  const r = createRaster(24, 20);
  ellipse(r, 12, 16, 9, 2, () => [0, 0, 0, 90]);
  towerShield(r, 3, 6, 18, 9);
  return outline(r, INK, 1);
}

/**
 * One tile of a captive's cell bars (18×34, like a slab gate): iron bars in a stone sill and lintel;
 * `open`, the bars are gone (pulled up into the lintel) and only the sill and lintel are left.
 */
function bars(open: boolean): Raster {
  const r = createRaster(18, 34);
  const base = 31;
  rect(r, 1, base - 3, 16, 3, STONE);
  rect(r, 1, base - 3, 16, 1, STONE_LIGHT);
  rect(r, 1, 3, 16, 3, STONE);
  rect(r, 1, 5, 16, 1, STONE_DARK);
  if (!open) {
    for (const x of [3, 8, 13]) {
      rect(r, x, 6, 2, base - 9, IRON);
      rect(r, x, 6, 1, base - 9, IRON_LIGHT);
    }
    rect(r, 2, 15, 14, 2, IRON_DARK);
    rect(r, 2, 15, 14, 1, IRON);
  }
  return outline(r, INK, 1);
}

export function helgrindFrames(): SpriteFrame[] {
  const east = hookEast();
  const south = turn(east);
  const west = flipX(east);
  const north = turn(turn(south));
  const hooks: [Dir4, Raster][] = [
    ['e', east],
    ['s', south],
    ['w', west],
    ['n', north],
  ];
  const foes: SpriteFrame[] = [];
  for (const side of ['s', 'n', 'w'] as const) {
    const add = (art: string, anim: string, i: number, raster: Raster, ox: number, oy: number): void => {
      foes.push({ name: `${art}_${anim}_${side}_${String(i)}`, raster, ox, oy });
      if (side === 'w')
        foes.push({ name: `${art}_${anim}_e_${String(i)}`, raster: flipX(raster), ox: raster.w - ox, oy });
    };
    const hh = (anim: string, i: number, r: Raster): void => {
      add('enemy_helhound', anim, i, r, 16, 30);
    };
    hh('idle', 0, wolf(side, 0, 'stand', HELHOUND));
    hh('hurt', 0, wolf(side, 2, 'stand', HELHOUND));
    for (let i = 0; i < 4; i++) hh('walk', i, wolf(side, i, 'stand', HELHOUND));
    hh('tell', 0, wolf(side, 0, 'crouch', HELHOUND));
    hh('tell', 1, wolf(side, 2, 'crouch', HELHOUND));
    hh('lunge', 0, wolf(side, 0, 'lunge', HELHOUND));
    hh('lunge', 1, wolf(side, 2, 'lunge', HELHOUND));
    const g = (anim: string, i: number, r: Raster): void => {
      add('enemy_garmr', anim, i, r, 24, 49);
    };
    g('sleep', 0, garmr(side, 0, 'crouch'));
    g('idle', 0, garmr(side, 0, 'stand'));
    for (let i = 0; i < 4; i++) g('walk', i, garmr(side, i, 'stand'));
    g('tell', 0, garmr(side, 0, 'crouch'));
    g('tell', 1, garmr(side, 2, 'crouch'));
    g('breath', 0, garmr(side, 0, 'howl'));
    g('breath', 1, garmr(side, 2, 'howl'));
    g('lunge', 0, garmr(side, 0, 'lunge'));
    g('lunge', 1, garmr(side, 2, 'lunge'));
    g('roar', 0, garmr(side, 0, 'howl'));
    g('reel', 0, garmr(side, 2, 'crouch'));
    const n = (anim: string, i: number, r: Raster): void => {
      add('enemy_nastrond', anim, i, r, 24, 51);
    };
    n('idle', 0, hollow(side, 0, 'rest', false));
    for (let i = 0; i < 4; i++) n('walk', i, hollow(side, i, 'rest', false));
    n('roar', 0, hollow(side, 0, 'raise', false));
    n('tell', 0, hollow(side, 0, 'raise', false));
    n('tell', 1, hollow(side, 1, 'raise', false));
    n('cut', 0, hollow(side, 0, 'cut', false));
    n('bare_idle', 0, hollow(side, 0, 'rest', true));
    for (let i = 0; i < 4; i++) n('bare_walk', i, hollow(side, i, 'rest', true));
    n('flail', 0, hollow(side, 0, 'flail', true));
    n('flail', 1, hollow(side, 2, 'flail', true));
  }
  return [
    ...foes,
    { name: 'enemy_tower_shield_idle_s_0', raster: shieldDown(), ox: 12, oy: 16 },
    { name: 'fix_post_idle_s_0', raster: post(), ox: 9, oy: 25 },
    ...hooks.map(([d, raster]) => ({ name: `fx_grapple_fly_${d}_0`, raster, ox: 7, oy: 7 })),
    { name: 'fx_chain_idle_s_0', raster: link(), ox: 3, oy: 3 },
    { name: 'fix_raft_idle_s_0', raster: raft(), ox: 17, oy: 31 },
    { name: 'fix_bars_closed_s_0', raster: bars(false), ox: 9, oy: 31 },
    { name: 'fix_bars_open_s_0', raster: bars(true), ox: 9, oy: 31 },
  ];
}

const one = (frames: number, fps: number): AnimDef => ({ frames, fps, loop: true, dirs: ['s'] });
const ALL: readonly Dir4[] = ['s', 'n', 'w', 'e'];
const all = (frames: number, fps: number, loop = true): AnimDef => ({ frames, fps, loop, dirs: ALL });

export const HELGRIND_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  fix_post: { idle: one(1, 1) },
  fx_grapple: { fly: { frames: 1, fps: 1, loop: true, dirs: ALL } },
  fx_chain: { idle: one(1, 1) },
  fix_raft: { idle: one(1, 1) },
  fix_bars: { closed: one(1, 1), open: one(1, 1) },
  enemy_helhound: { idle: all(1, 1), hurt: all(1, 1), walk: all(4, 10), tell: all(2, 10), lunge: all(2, 10) },
  enemy_garmr: {
    sleep: all(1, 1),
    idle: all(1, 1),
    walk: all(4, 6),
    tell: all(2, 8),
    breath: all(2, 10),
    lunge: all(2, 10),
    roar: all(1, 1),
    reel: all(1, 1),
  },
  enemy_nastrond: {
    idle: all(1, 1),
    walk: all(4, 5),
    roar: all(1, 1),
    tell: all(2, 6),
    cut: all(1, 1),
    bare_idle: all(1, 1),
    bare_walk: all(4, 6),
    flail: all(2, 10),
  },
  enemy_tower_shield: { idle: one(1, 1) },
};
