import type { AnimDef } from '../anims';
import { ellipse, line, rect } from '../draw';
import { outline } from '../outline';
import { C } from '../palette';
import { blit, createRaster, flipX, hex, type Raster, type Rgba } from '../raster';
import { LOOKS, drawPerson } from './people';
import type { SpriteFrame } from './types';

/** Útgarðr (M10a): Jötunvörðr the warden, and Kolbeinn with his seiðr-staff. M10b: Hrímnir, his hand, his pillars. */

const INK = hex(C.ink);
const SHADOW: Rgba = [0, 0, 0, 80];

// ── Jötunvörðr: 52×60, his feet at (26, 56) ────────────────────────────────────────────────────────────

const RIME = hex('#b8d4ea');
const RIME_LIGHT = hex('#e6f4ff');
const RIME_DARK = hex('#7a9ab8');
const HIDE = hex('#5a6878');
const THAW = hex('#e8946a');
const THAW_LIGHT = hex('#ffc89a');
const EYE = hex('#7edcff');

export type WardenPose = 'idle' | 'walk' | 'raise' | 'stomp' | 'thawed';

/**
 * A frost-giant in a hauberk of rime: great shoulders, fists like boulders. Raising a knee (the tell) he
 * stands on one leg; thawed by Eldr his rime glows orange and runs.
 */
function warden(side: 's' | 'n' | 'w', pose: WardenPose, phase: number): Raster {
  const r = createRaster(52, 60);
  ellipse(r, 26, 56, pose === 'stomp' ? 22 : 14, 1, SHADOW);
  const thawed = pose === 'thawed';
  const body = thawed ? THAW : RIME;
  const light = thawed ? THAW_LIGHT : RIME_LIGHT;
  const step = pose === 'walk' ? phase * 2 - 1 : 0;
  const crouch = pose === 'stomp' ? 3 : thawed ? 2 : 0;
  // Legs: one raised high in the tell.
  const raised = pose === 'raise';
  rect(r, 16, 40 + crouch - (raised ? 8 : 0) + step, 7, raised ? 10 : 16 - crouch - step, HIDE);
  rect(r, 29, 40 + crouch - step, 7, 16 - crouch + step, HIDE);
  // Body and the hauberk of rime.
  rect(r, 11, 18 + crouch, 30, 24, body);
  rect(r, 11, 18 + crouch, 30, 3, light);
  for (let y = 24 + crouch; y < 42 + crouch; y += 4) line(r, 12, y, 39, y, RIME_DARK);
  // Head, sunk between the shoulders.
  ellipse(r, 26, 13 + crouch, 7, 6, side === 'n' ? RIME_DARK : body);
  if (side === 's') {
    rect(r, 22, 13 + crouch, 3, 2, thawed ? INK : EYE);
    rect(r, 28, 13 + crouch, 3, 2, thawed ? INK : EYE);
  } else if (side === 'w') rect(r, 20, 13 + crouch, 3, 2, thawed ? INK : EYE);
  // Fists: raised over his head to stomp, down at his sides otherwise.
  const up = pose === 'raise';
  rect(r, 4, up ? 8 : 26 + crouch, 8, 10, body);
  rect(r, 40, up ? 8 : 26 + crouch, 8, 10, body);
  if (pose === 'stomp') {
    line(r, 3, 54, 12, 51, RIME_LIGHT);
    line(r, 49, 54, 40, 51, RIME_LIGHT);
  }
  if (thawed) {
    // Meltwater running off him.
    for (const x of [14, 20, 31, 37]) line(r, x, 30, x, 36 + (x % 3), THAW_LIGHT);
  }
  return outline(r, INK, 1);
}

// ── Kolbeinn: 40×40, his feet at (20, 35) ─────────────────────────────────────────────────────────────

const STAFF = hex('#5a4630');
const STAFF_TIP = hex('#9ae8ff');

export type SeidmadrPose = 'idle' | 'walk' | 'draw' | 'strike' | 'cast' | 'reel';

/** Kolbeinn in his robe with his seiðr-staff: held across him, drawn back (the tell), swung, raised to cast. */
function seidmadr(side: 's' | 'n' | 'w', pose: SeidmadrPose, phase: number): Raster {
  const r = createRaster(40, 40);
  ellipse(r, 20, 35, 9, 2, SHADOW);
  const arms = pose === 'cast' ? 'up' : pose === 'strike' ? 'forward' : 'down';
  blit(r, drawPerson(LOOKS.kolbeinn, side, pose === 'walk' ? phase * 2 : 0, { arms }), 4, 6);
  const tip = pose === 'cast' ? STAFF_TIP : hex('#c8f2ff');
  if (pose === 'draw') {
    // Drawn back over the shoulder.
    line(r, 30, 30, 34, 8, STAFF);
    rect(r, 33, 6, 3, 3, tip);
  } else if (pose === 'strike') {
    line(r, 8, 24, 32, 20, STAFF);
    rect(r, 5, 22, 3, 3, tip);
  } else if (pose === 'cast') {
    line(r, 31, 32, 31, 7, STAFF);
    ellipse(r, 31, 6, 2, 2, STAFF_TIP);
  } else if (pose === 'reel') {
    line(r, 6, 30, 14, 14, STAFF);
  } else {
    line(r, 29, 33, 29, 10, STAFF);
    rect(r, 28, 8, 3, 3, tip);
  }
  return outline(r, INK, 1);
}

// ── Hrímnir, the Rime King: 76×84, his feet at (38, 80) ───────────────────────────────────────────────

const KING = hex('#9cc4e0');
const KING_LIGHT = hex('#dcf0ff');
const KING_DARK = hex('#4c6e90');
const BEARD = hex('#f0f8ff');
const RUNE_DIM = hex('#3c5a78');
const RUNE_LIT = hex('#ff7a4a');
const CROWN_ICE = hex('#7edcff');

export type KingPose = 'idle' | 'roar' | 'reach' | 'inhale' | 'breathe' | 'open';

/**
 * The Rime King risen to the waist out of the binding-rune in the floor: a crown of ice, a beard like a
 * glacier, and on his chest the heart-rune that burns when he is open.
 */
function king(side: 's' | 'n' | 'w', pose: KingPose): Raster {
  const r = createRaster(76, 84);
  ellipse(r, 38, 79, 30, 3, SHADOW);
  // The rune-hole he rises from.
  ellipse(r, 38, 76, 28, 5, KING_DARK);
  const stoop = pose === 'open' ? 6 : 0;
  rect(r, 16, 36 + stoop, 44, 40 - stoop, KING);
  rect(r, 16, 36 + stoop, 44, 4, KING_LIGHT);
  // Shoulders and arms: one reaching out to sweep, both raised to roar.
  const roar = pose === 'roar';
  rect(r, 6, roar ? 12 : 38 + stoop, 10, roar ? 30 : 30, KING);
  rect(r, 60, pose === 'reach' ? 30 : roar ? 12 : 38 + stoop, pose === 'reach' ? 12 : 10, 30, KING);
  // Head and crown.
  ellipse(r, 38, 26 + stoop, 13, 12, side === 'n' ? KING_DARK : KING);
  for (const x of [28, 33, 38, 43, 48]) line(r, x, 15 + stoop, x + 1, 8 + stoop, CROWN_ICE);
  if (side !== 'n') {
    const cx = side === 's' ? 38 : 32;
    rect(r, cx - 6, 24 + stoop, 4, 2, CROWN_ICE);
    if (side === 's') rect(r, cx + 3, 24 + stoop, 4, 2, CROWN_ICE);
    // The beard, a frozen fall over his chest (parted wide while he breathes).
    const open = pose === 'inhale' || pose === 'breathe';
    rect(r, cx - 6, 32 + stoop, 13, open ? 6 : 14, BEARD);
    if (open) ellipse(r, cx, 34 + stoop, 4, pose === 'breathe' ? 4 : 2, INK);
  }
  // The heart-rune.
  if (side !== 'n') {
    const rune = pose === 'open' ? RUNE_LIT : RUNE_DIM;
    line(r, 38, 50 + stoop, 38, 62 + stoop, rune);
    line(r, 38, 50 + stoop, 44, 56 + stoop, rune);
    line(r, 38, 56 + stoop, 32, 62 + stoop, rune);
  }
  return outline(r, INK, 1);
}

/** His hand, 40×28: first only its shadow on the floor, then the hand itself sweeping; cracked when struck. */
function hand(pose: 'shadow' | 'sweep' | 'struck'): Raster {
  const r = createRaster(40, 28);
  ellipse(r, 20, 23, 15, 3, SHADOW);
  if (pose === 'shadow') {
    ellipse(r, 20, 23, 15, 3, [0, 0, 0, 120]);
    return r;
  }
  ellipse(r, 20, 14, 14, 8, KING);
  for (const x of [9, 15, 21, 27]) rect(r, x, 18, 4, 5, KING);
  rect(r, 8, 9, 24, 2, KING_LIGHT);
  if (pose === 'struck') {
    line(r, 12, 8, 20, 20, RUNE_LIT);
    line(r, 28, 8, 22, 20, RUNE_LIT);
  }
  return outline(r, INK, 1);
}

/** A rime pillar, 36×52: its shadow, falling, then its wreck of glaze and shards. */
function pillar(pose: 'shadow' | 'fall' | 'fallen', phase: number): Raster {
  const r = createRaster(36, 52);
  if (pose === 'shadow') {
    ellipse(r, 18, 46, 8 + phase * 4, 3 + phase, [0, 0, 0, 110]);
    return r;
  }
  if (pose === 'fall') {
    ellipse(r, 18, 46, 14, 2, SHADOW);
    rect(r, 12, 4 + phase * 10, 12, 30, KING);
    rect(r, 12, 4 + phase * 10, 3, 30, KING_LIGHT);
    return outline(r, INK, 1);
  }
  ellipse(r, 18, 42, 15, 7, hex('#cfe8f8'));
  ellipse(r, 18, 41, 12, 5, KING_LIGHT);
  for (const [x, y] of [
    [8, 38],
    [24, 36],
    [16, 44],
  ] as const)
    rect(r, x, y, 4, 3, KING);
  return outline(r, INK, 1);
}

export function utgardFrames(): SpriteFrame[] {
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
    const jv = (anim: WardenPose, i: number): void => {
      add('enemy_jotunvordr', anim, side, i, warden(side, anim, i), 26, 56);
    };
    jv('idle', 0);
    jv('walk', 0);
    jv('walk', 1);
    jv('raise', 0);
    jv('stomp', 0);
    jv('thawed', 0);
    const kb = (anim: SeidmadrPose, i: number): void => {
      add('enemy_kolbeinn', anim, side, i, seidmadr(side, anim, i), 20, 35);
    };
    kb('idle', 0);
    kb('walk', 0);
    kb('walk', 1);
    kb('draw', 0);
    kb('strike', 0);
    kb('cast', 0);
    kb('reel', 0);
    for (const pose of ['idle', 'roar', 'reach', 'inhale', 'breathe', 'open'] as const)
      add('enemy_hrimnir', pose, side, 0, king(side, pose), 38, 80);
  }
  for (const pose of ['shadow', 'sweep', 'struck'] as const)
    out.push({ name: `enemy_hrimnir_hand_${pose}_s_0`, raster: hand(pose), ox: 20, oy: 24 });
  // Spawned mid-fight, the hand and a pillar show for a frame before their machines first run: as shadows.
  out.push({ name: 'enemy_hrimnir_hand_idle_s_0', raster: hand('shadow'), ox: 20, oy: 24 });
  out.push({ name: 'enemy_rime_pillar_idle_s_0', raster: pillar('shadow', 0), ox: 18, oy: 47 });
  out.push({ name: 'enemy_rime_pillar_shadow_s_0', raster: pillar('shadow', 0), ox: 18, oy: 47 });
  out.push({ name: 'enemy_rime_pillar_shadow_s_1', raster: pillar('shadow', 1), ox: 18, oy: 47 });
  out.push({ name: 'enemy_rime_pillar_fall_s_0', raster: pillar('fall', 0), ox: 18, oy: 47 });
  out.push({ name: 'enemy_rime_pillar_fall_s_1', raster: pillar('fall', 1), ox: 18, oy: 47 });
  out.push({ name: 'enemy_rime_pillar_fallen_s_0', raster: pillar('fallen', 0), ox: 18, oy: 47 });
  return out;
}

const all = (frames: number, fps: number): AnimDef => ({
  frames,
  fps,
  loop: true,
  dirs: ['s', 'n', 'w', 'e'],
});

const one: AnimDef = { frames: 1, fps: 1, loop: true, dirs: ['s'] };
const south = (frames: number, fps: number, loop = true): AnimDef => ({ frames, fps, loop, dirs: ['s'] });

export const UTGARD_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  enemy_jotunvordr: {
    idle: all(1, 1),
    walk: all(2, 4),
    raise: all(1, 1),
    stomp: all(1, 1),
    thawed: all(1, 1),
  },
  enemy_kolbeinn: {
    idle: all(1, 1),
    walk: all(2, 6),
    draw: all(1, 1),
    strike: all(1, 1),
    cast: all(1, 1),
    reel: all(1, 1),
  },
  enemy_hrimnir: {
    idle: all(1, 1),
    roar: all(1, 1),
    reach: all(1, 1),
    inhale: all(1, 1),
    breathe: all(1, 1),
    open: all(1, 1),
  },
  enemy_hrimnir_hand: { idle: one, shadow: one, sweep: one, struck: one },
  enemy_rime_pillar: { idle: one, shadow: south(2, 3), fall: south(2, 12, false), fallen: one },
};
