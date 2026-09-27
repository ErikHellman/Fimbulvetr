import type { Dir4 } from '@core/math/dir';
import type { AnimDef } from '../anims';
import { ellipse, line, rect } from '../draw';
import { outline } from '../outline';
import { C } from '../palette';
import { createRaster, flipX, hex, type Raster } from '../raster';
import { drawPerson, type Look, type Side } from './people';
import type { SpriteFrame } from './types';

const INK = hex(C.ink);

// ── Vargr: a grey wolf, 32×32, feet at (16, 30) ──────────────────────────────────────────────────────

const FUR = hex('#7a7470');
const FUR_SHADE = hex('#524d4a');
const FUR_LIGHT = hex('#a39d98');
const WOLF_EYE = hex('#f2d45c');
const FANG = hex('#f4efe2');

type WolfPose = 'stand' | 'crouch' | 'lunge';

function wolfSide(phase: number, pose: WolfPose): Raster {
  const r = createRaster(32, 32);
  const low = pose === 'crouch' ? 2 : 0;
  const stretch = pose === 'lunge' ? 2 : 0;
  const step = [0, 1, 0, -1][phase] ?? 0;
  // Legs: front pair left (the wolf faces west), hind pair right.
  const legTop = 23 + low;
  if (pose === 'lunge') {
    line(r, 9, 22, 4, 27, FUR_SHADE);
    line(r, 10, 22, 5, 27, FUR);
    line(r, 22, 22, 27, 27, FUR_SHADE);
    line(r, 23, 22, 28, 27, FUR);
  } else {
    rect(r, 8 + step, legTop, 2, 29 - legTop, FUR_SHADE);
    rect(r, 11 - step, legTop, 2, 29 - legTop, FUR);
    rect(r, 19 - step, legTop, 2, 29 - legTop, FUR_SHADE);
    rect(r, 22 + step, legTop, 2, 29 - legTop, FUR);
  }
  // Tail, body, head.
  line(r, 24 + stretch, 18 + low, 28, 14 + low + (pose === 'crouch' ? 3 : 0), FUR_SHADE);
  line(r, 24 + stretch, 19 + low, 28, 15 + low + (pose === 'crouch' ? 3 : 0), FUR);
  ellipse(r, 16, 20 + low, 9 + stretch, 5 - (pose === 'lunge' ? 1 : 0), (_x, y) =>
    y > 21 + low ? FUR_SHADE : FUR,
  );
  rect(r, 10, 17 + low, 8, 2, FUR_LIGHT);
  const hx = 8 - (pose === 'lunge' ? 1 : 0);
  const hy = 16 + low + (pose === 'crouch' ? 2 : 0);
  ellipse(r, hx, hy, 4.5, 4, (_x, y) => (y > hy + 1 ? FUR_SHADE : FUR));
  rect(r, hx - 5, hy, 4, 3, FUR);
  rect(r, hx - 5, hy + 2, 4, 1, FUR_SHADE);
  rect(r, hx - 5, hy, 1, 1, INK);
  rect(r, hx - 1, hy - 1, 1, 1, WOLF_EYE);
  const earBack = pose === 'crouch' ? 1 : 0;
  rect(r, hx + earBack, hy - 6 + earBack, 2, 3, FUR_SHADE);
  rect(r, hx + 2 + earBack, hy - 5 + earBack, 2, 2, FUR);
  if (pose !== 'stand') {
    rect(r, hx - 4, hy + 2, 1, 1, FANG);
    rect(r, hx - 2, hy + 2, 1, 1, FANG);
  }
  return outline(r, INK, 2);
}

function wolfFront(phase: number, pose: WolfPose): Raster {
  const r = createRaster(32, 32);
  const low = pose === 'crouch' ? 2 : pose === 'lunge' ? -1 : 0;
  const liftL = phase === 1 ? 1 : 0;
  const liftR = phase === 3 ? 1 : 0;
  ellipse(r, 16, 23 + low, 7, 4, (x) => (x > 18 ? FUR_SHADE : FUR));
  rect(r, 12, 24 + low, 2, 5 - low - liftL, FUR);
  rect(r, 18, 24 + low, 2, 5 - low - liftR, FUR_SHADE);
  const hy = 16 + low;
  ellipse(r, 16, hy, 5.5, 5, (x) => (x > 18.5 ? FUR_SHADE : FUR));
  rect(r, 11, hy - 7, 2, 4, FUR_SHADE);
  rect(r, 19, hy - 7, 2, 4, FUR_SHADE);
  rect(r, 14, hy + 2, 5, 3, FUR_LIGHT);
  rect(r, 16, hy + 2, 1, 1, INK);
  rect(r, 14, hy - 1, 1, 1, WOLF_EYE);
  rect(r, 18, hy - 1, 1, 1, WOLF_EYE);
  if (pose !== 'stand') {
    rect(r, 14, hy + 4, 1, 1, FANG);
    rect(r, 18, hy + 4, 1, 1, FANG);
  }
  return outline(r, INK, 2);
}

function wolfBack(phase: number, pose: WolfPose): Raster {
  const r = createRaster(32, 32);
  const low = pose === 'crouch' ? 2 : 0;
  const liftL = phase === 1 ? 1 : 0;
  const liftR = phase === 3 ? 1 : 0;
  rect(r, 11, 24, 2, 5 - liftL, FUR_SHADE);
  rect(r, 19, 24, 2, 5 - liftR, FUR_SHADE);
  ellipse(r, 16, 20 + low, 7, 6, (x) => (x > 18 ? FUR_SHADE : FUR));
  rect(r, 15, 24 + low, 2, 5 - low, FUR_LIGHT);
  ellipse(r, 16, 13 + low, 4.5, 4, (x) => (x > 18 ? FUR_SHADE : FUR));
  rect(r, 12, 8 + low, 2, 3, FUR_SHADE);
  rect(r, 18, 8 + low, 2, 3, FUR_SHADE);
  return outline(r, INK, 2);
}

function wolf(side: Side, phase: number, pose: WolfPose): Raster {
  if (side === 'w') return wolfSide(phase, pose);
  return side === 's' ? wolfFront(phase, pose) : wolfBack(phase, pose);
}

// ── Draugr: a dead man in grave clothes, from the people parts ──────────────────────────────────────

const DRAUGR_LOOK: Look = {
  skin: '#9aab9c',
  hair: '#d9d8c8',
  hairStyle: 'bald',
  beard: '#c4c3b3',
  top: '#5d5848',
  legs: 'pants',
  bottom: '#3e3a30',
};
const DEAD_EYES = '#bfefff';

/** The draugr halfway out of its grave: the figure sunk into a mound of earth. */
function risen(side: Side, sink: number): Raster {
  const r = drawPerson(DRAUGR_LOOK, side, 0, { sink, eyes: DEAD_EYES, arms: 'up' });
  ellipse(r, 16, 28, 10, 2.2, (x) => (x > 19 ? hex(C.dirtShade) : hex(C.dirt)));
  return r;
}

// ── Troll: 48×56, feet at (24, 54) ───────────────────────────────────────────────────────────────────

const HIDE = hex('#7f8c64');
const HIDE_SHADE = hex('#5a6645');
const HIDE_LIGHT = hex('#a2ad84');
const MOSS = hex('#48602f');
const LOIN = hex(C.wood);
const TUSK = hex('#efe8d0');
const TROLL_EYE = hex('#f0c040');
const CLUB = hex(C.woodShade);

type Club = 'down' | 'up' | 'smash';

function trollFront(phase: number, club: Club, back: boolean): Raster {
  const r = createRaster(48, 56);
  const liftL = phase === 1 ? 2 : 0;
  const liftR = phase === 3 ? 2 : 0;
  rect(r, 15, 44, 7, 10 - liftL, HIDE);
  rect(r, 26, 44, 7, 10 - liftR, HIDE_SHADE);
  rect(r, 14, 52 - liftL, 9, 2, HIDE_SHADE);
  rect(r, 25, 52 - liftR, 9, 2, HIDE_SHADE);
  ellipse(r, 24, 31, 14, 13, (x) => (x > 30 ? HIDE_SHADE : HIDE));
  if (!back) ellipse(r, 24, 35, 8, 7, HIDE_LIGHT);
  rect(r, 14, 40, 20, 5, LOIN);
  // Arms: the left hangs, the right holds the club.
  rect(r, 7, 24, 5, 18, HIDE);
  rect(r, 6, 41, 6, 4, HIDE_SHADE);
  if (club === 'up') {
    rect(r, 36, 10, 5, 18, HIDE_SHADE);
    rect(r, 36, 6, 6, 5, HIDE_SHADE);
    rect(r, 37, 3, 5, 5, CLUB);
    rect(r, 36, 2, 7, 3, CLUB);
  } else if (club === 'smash') {
    rect(r, 36, 26, 5, 16, HIDE_SHADE);
    rect(r, 10, 46, 30, 5, CLUB);
    rect(r, 8, 45, 8, 7, CLUB);
  } else {
    rect(r, 36, 24, 5, 18, HIDE_SHADE);
    rect(r, 37, 40, 5, 13, CLUB);
    rect(r, 36, 47, 7, 6, CLUB);
  }
  // Head, low between the shoulders.
  ellipse(r, 24, 15, 7, 6, (x) => (x > 27 ? HIDE_SHADE : HIDE));
  rect(r, 18, 8, 12, 3, MOSS);
  if (!back) {
    ellipse(r, 24, 17, 2.5, 3, HIDE_SHADE);
    rect(r, 21, 13, 1, 2, TROLL_EYE);
    rect(r, 27, 13, 1, 2, TROLL_EYE);
    rect(r, 21, 20, 1, 2, TUSK);
    rect(r, 27, 20, 1, 2, TUSK);
  } else rect(r, 17, 11, 14, 4, MOSS);
  return outline(r, INK, 2);
}

function trollSide(phase: number, club: Club): Raster {
  const r = createRaster(48, 56);
  const step = [0, 2, 0, -2][phase] ?? 0;
  rect(r, 22 + step, 44, 6, 10, HIDE_SHADE);
  rect(r, 30 - step, 44, 6, 10, HIDE);
  ellipse(r, 27, 32, 13, 13, (x) => (x > 32 ? HIDE_SHADE : HIDE));
  rect(r, 17, 40, 20, 5, LOIN);
  ellipse(r, 15, 22, 6, 5, (x) => (x > 17 ? HIDE_SHADE : HIDE));
  rect(r, 12, 17, 9, 3, MOSS);
  ellipse(r, 10, 24, 2.5, 3, HIDE_SHADE);
  rect(r, 12, 21, 1, 2, TROLL_EYE);
  rect(r, 11, 27, 1, 2, TUSK);
  if (club === 'up') {
    rect(r, 20, 8, 5, 20, HIDE_SHADE);
    rect(r, 17, 3, 6, 8, CLUB);
  } else if (club === 'smash') {
    rect(r, 10, 30, 6, 12, HIDE_SHADE);
    rect(r, 3, 44, 14, 6, CLUB);
  } else {
    rect(r, 13, 30, 5, 14, HIDE_SHADE);
    rect(r, 12, 42, 5, 11, CLUB);
  }
  return outline(r, INK, 2);
}

function troll(side: Side, phase: number, club: Club): Raster {
  if (side === 'w') return trollSide(phase, club);
  return trollFront(phase, club, side === 'n');
}

// ── A puff of smoke where an enemy dies ──────────────────────────────────────────────────────────────

function poof(i: number): Raster {
  const r = createRaster(24, 24);
  const grow = [3, 5, 7, 8][i] ?? 8;
  const a = [230, 200, 150, 90][i] ?? 90;
  const white: readonly [number, number, number, number] = [236, 234, 228, a];
  const grey: readonly [number, number, number, number] = [180, 178, 172, a];
  for (const [dx, dy] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ] as const)
    ellipse(r, 12 + dx * grow * 0.6, 12 + dy * grow * 0.6, grow * 0.55, grow * 0.55, grey);
  ellipse(r, 12, 12, grow * 0.6, grow * 0.6, white);
  return r;
}

export function enemyFrames(): SpriteFrame[] {
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
      add('enemy_vargr', anim, side, i, r, 16, 30);
    };
    v('idle', 0, wolf(side, 0, 'stand'));
    v('hurt', 0, wolf(side, 2, 'stand'));
    for (let i = 0; i < 4; i++) v('walk', i, wolf(side, i, 'stand'));
    v('tell', 0, wolf(side, 0, 'crouch'));
    v('tell', 1, wolf(side, 2, 'crouch'));
    v('lunge', 0, wolf(side, 0, 'lunge'));
    v('lunge', 1, wolf(side, 2, 'lunge'));

    const d = (anim: string, i: number, r: Raster): void => {
      add('enemy_draugr', anim, side, i, r, 16, 30);
    };
    d('idle', 0, drawPerson(DRAUGR_LOOK, side, 0, { eyes: DEAD_EYES }));
    d('hurt', 0, drawPerson(DRAUGR_LOOK, side, 2, { eyes: DEAD_EYES }));
    for (let i = 0; i < 4; i++) d('walk', i, drawPerson(DRAUGR_LOOK, side, i, { eyes: DEAD_EYES }));
    [22, 16, 10, 4].forEach((sink, i) => {
      d('rise', i, risen(side, sink));
    });
    d('tell', 0, drawPerson(DRAUGR_LOOK, side, 0, { eyes: DEAD_EYES, arms: 'up' }));
    d('tell', 1, drawPerson(DRAUGR_LOOK, side, 1, { eyes: DEAD_EYES, arms: 'up' }));
    d('swing', 0, drawPerson(DRAUGR_LOOK, side, 0, { eyes: DEAD_EYES, arms: 'forward' }));
    d('swing', 1, drawPerson(DRAUGR_LOOK, side, 2, { eyes: DEAD_EYES, arms: 'forward' }));

    const t = (anim: string, i: number, r: Raster): void => {
      add('enemy_troll', anim, side, i, r, 24, 54);
    };
    t('idle', 0, troll(side, 0, 'down'));
    for (let i = 0; i < 4; i++) t('walk', i, troll(side, i, 'down'));
    t('tell', 0, troll(side, 0, 'up'));
    t('tell', 1, troll(side, 2, 'up'));
    t('smash', 0, troll(side, 0, 'smash'));
    t('smash', 1, troll(side, 2, 'smash'));
  }
  for (let i = 0; i < 4; i++) out.push({ name: `fx_poof_idle_s_${i}`, raster: poof(i), ox: 12, oy: 18 });
  return out;
}

const ALL: readonly Dir4[] = ['s', 'n', 'w', 'e'];
const a = (frames: number, fps: number, loop = true): AnimDef => ({ frames, fps, loop, dirs: ALL });

export const ENEMY_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  enemy_vargr: { idle: a(1, 1), hurt: a(1, 1), walk: a(4, 8), tell: a(2, 8), lunge: a(2, 10) },
  enemy_draugr: {
    idle: a(1, 1),
    hurt: a(1, 1),
    walk: a(4, 4),
    rise: a(4, 6, false),
    tell: a(2, 6),
    swing: a(2, 12, false),
  },
  enemy_troll: { idle: a(1, 1), walk: a(4, 4), tell: a(2, 5), smash: a(2, 10, false) },
  fx_poof: { idle: { frames: 4, fps: 12, loop: false, dirs: ['s'] } },
};
