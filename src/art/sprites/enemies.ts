import type { Dir4 } from '@core/math/dir';
import type { AnimDef } from '../anims';
import { ellipse, line, rect } from '../draw';
import { outline } from '../outline';
import { C } from '../palette';
import { createRaster, flipX, hex, type Raster, type Rgba } from '../raster';
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

/** A troll's colours: the raid troll, the mossier forest troll, and the grey of one turned to stone. */
interface TrollPal {
  readonly hide: Rgba;
  readonly shade: Rgba;
  readonly light: Rgba;
  readonly moss: Rgba;
  readonly loin: Rgba;
  readonly tusk: Rgba;
  readonly eye: Rgba;
  readonly club: Rgba;
}

const RAID_TROLL: TrollPal = {
  hide: hex('#7f8c64'),
  shade: hex('#5a6645'),
  light: hex('#a2ad84'),
  moss: hex('#48602f'),
  loin: hex(C.wood),
  tusk: hex('#efe8d0'),
  eye: hex('#f0c040'),
  club: hex(C.woodShade),
};

const FOREST_TROLL: TrollPal = {
  hide: hex('#6b6a4e'),
  shade: hex('#4a4a34'),
  light: hex('#8e8c68'),
  moss: hex('#3d6a2c'),
  loin: hex('#5a4630'),
  tusk: hex('#e8dcc0'),
  eye: hex('#e8a030'),
  club: hex('#4a3524'),
};

/** Stone keeps the shape and loses the life: no eyes shine in it. */
const STONE_TROLL: TrollPal = {
  hide: hex(C.rock),
  shade: hex(C.rockShade),
  light: hex(C.rockLight),
  moss: hex('#5d7a4a'),
  loin: hex(C.rockShade),
  tusk: hex(C.rockLight),
  eye: hex(C.rockShade),
  club: hex(C.rockShade),
};

type Club = 'down' | 'up' | 'smash';

function trollFront(P: TrollPal, phase: number, club: Club, back: boolean): Raster {
  const r = createRaster(48, 56);
  const liftL = phase === 1 ? 2 : 0;
  const liftR = phase === 3 ? 2 : 0;
  rect(r, 15, 44, 7, 10 - liftL, P.hide);
  rect(r, 26, 44, 7, 10 - liftR, P.shade);
  rect(r, 14, 52 - liftL, 9, 2, P.shade);
  rect(r, 25, 52 - liftR, 9, 2, P.shade);
  ellipse(r, 24, 31, 14, 13, (x) => (x > 30 ? P.shade : P.hide));
  if (!back) ellipse(r, 24, 35, 8, 7, P.light);
  rect(r, 14, 40, 20, 5, P.loin);
  // Arms: the left hangs, the right holds the club.
  rect(r, 7, 24, 5, 18, P.hide);
  rect(r, 6, 41, 6, 4, P.shade);
  if (club === 'up') {
    rect(r, 36, 10, 5, 18, P.shade);
    rect(r, 36, 6, 6, 5, P.shade);
    rect(r, 37, 3, 5, 5, P.club);
    rect(r, 36, 2, 7, 3, P.club);
  } else if (club === 'smash') {
    rect(r, 36, 26, 5, 16, P.shade);
    rect(r, 10, 46, 30, 5, P.club);
    rect(r, 8, 45, 8, 7, P.club);
  } else {
    rect(r, 36, 24, 5, 18, P.shade);
    rect(r, 37, 40, 5, 13, P.club);
    rect(r, 36, 47, 7, 6, P.club);
  }
  // Head, low between the shoulders.
  ellipse(r, 24, 15, 7, 6, (x) => (x > 27 ? P.shade : P.hide));
  rect(r, 18, 8, 12, 3, P.moss);
  if (!back) {
    ellipse(r, 24, 17, 2.5, 3, P.shade);
    rect(r, 21, 13, 1, 2, P.eye);
    rect(r, 27, 13, 1, 2, P.eye);
    rect(r, 21, 20, 1, 2, P.tusk);
    rect(r, 27, 20, 1, 2, P.tusk);
  } else rect(r, 17, 11, 14, 4, P.moss);
  return outline(r, INK, 2);
}

function trollSide(P: TrollPal, phase: number, club: Club): Raster {
  const r = createRaster(48, 56);
  const step = [0, 2, 0, -2][phase] ?? 0;
  rect(r, 22 + step, 44, 6, 10, P.shade);
  rect(r, 30 - step, 44, 6, 10, P.hide);
  ellipse(r, 27, 32, 13, 13, (x) => (x > 32 ? P.shade : P.hide));
  rect(r, 17, 40, 20, 5, P.loin);
  ellipse(r, 15, 22, 6, 5, (x) => (x > 17 ? P.shade : P.hide));
  rect(r, 12, 17, 9, 3, P.moss);
  ellipse(r, 10, 24, 2.5, 3, P.shade);
  rect(r, 12, 21, 1, 2, P.eye);
  rect(r, 11, 27, 1, 2, P.tusk);
  if (club === 'up') {
    rect(r, 20, 8, 5, 20, P.shade);
    rect(r, 17, 3, 6, 8, P.club);
  } else if (club === 'smash') {
    rect(r, 10, 30, 6, 12, P.shade);
    rect(r, 3, 44, 14, 6, P.club);
  } else {
    rect(r, 13, 30, 5, 14, P.shade);
    rect(r, 12, 42, 5, 11, P.club);
  }
  return outline(r, INK, 2);
}

function troll(side: Side, phase: number, club: Club, P: TrollPal = RAID_TROLL): Raster {
  if (side === 'w') return trollSide(P, phase, club);
  return trollFront(P, phase, club, side === 'n');
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

    const f = (anim: string, i: number, r: Raster): void => {
      add('enemy_forest_troll', anim, side, i, r, 24, 54);
    };
    f('idle', 0, troll(side, 0, 'down', FOREST_TROLL));
    for (let i = 0; i < 4; i++) f('walk', i, troll(side, i, 'down', FOREST_TROLL));
    f('tell', 0, troll(side, 0, 'up', FOREST_TROLL));
    f('tell', 1, troll(side, 2, 'up', FOREST_TROLL));
    f('smash', 0, troll(side, 0, 'smash', FOREST_TROLL));
    f('smash', 1, troll(side, 2, 'smash', FOREST_TROLL));
  }
  // A troll the sun caught, hunched over its club; one frame, facing the viewer.
  out.push({ name: 'prop_troll_stone_idle_s_0', raster: troll('s', 0, 'down', STONE_TROLL), ox: 24, oy: 54 });
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
  enemy_forest_troll: { idle: a(1, 1), walk: a(4, 4), tell: a(2, 5), smash: a(2, 10, false) },
  prop_troll_stone: { idle: { frames: 1, fps: 1, loop: true, dirs: ['s'] } },
  fx_poof: { idle: { frames: 4, fps: 12, loop: false, dirs: ['s'] } },
};
