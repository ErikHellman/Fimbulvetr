import type { Dir4 } from '@core/math/dir';
import type { AnimDef } from '../anims';
import { ellipse, line, rect } from '../draw';
import { outline } from '../outline';
import { C } from '../palette';
import { blit, createRaster, flipX, hex, type Raster, type Rgba } from '../raster';
import { flipY } from './haugar';
import { raft } from './helgrind';
import { sunk } from './niflmyrr';
import { drawPerson, type Look } from './people';
import type { SpriteFrame } from './types';

/** Sökkva Hof (M7b): Vindr's gust, the wind fans that work the sluices, and the sailing raft. */

const INK = hex(C.ink);
const WIND: Rgba = [214, 236, 240, 200];
const WIND_FAINT: Rgba = [180, 214, 224, 120];
const STONE = hex('#46545a');
const STONE_LIGHT = hex('#6c7e84');
const STONE_DARK = hex('#28323a');
const BRONZE = hex('#a07a3c');
const BRONZE_LIGHT = hex('#d8b062');
const BRONZE_DARK = hex('#5e4420');
const SAIL = hex('#d8ccae');
const SAIL_SHADE = hex('#a89c80');
const MAST = hex('#5a4632');

/**
 * The gust, blowing east: three streaks of wind curling at their heads, stepping forward a little between
 * the two frames. Turned for the other facings.
 */
function gustSide(i: number): Raster {
  const r = createRaster(22, 14);
  const off = i * 2;
  for (const [y, len, c] of [
    [3, 12, WIND],
    [7, 16, WIND],
    [11, 10, WIND_FAINT],
  ] as const) {
    const x0 = 2 + off + (16 - len) / 2;
    line(r, x0, y, x0 + len - 3, y, c);
    // A curl at the head of each streak.
    line(r, x0 + len - 3, y, x0 + len - 2, y - 1, c);
  }
  return r;
}

/** The gust blowing north: the side view turned on its edge. */
function gustUp(i: number): Raster {
  const side = gustSide(i);
  const r = createRaster(side.h, side.w);
  for (let y = 0; y < side.h; y++)
    for (let x = 0; x < side.w; x++) {
      const k = (y * side.w + x) * 4;
      const d = ((side.w - 1 - x) * r.w + y) * 4;
      for (let c = 0; c < 4; c++) r.data[d + c] = side.data[k + c] ?? 0;
    }
  return r;
}

/** A wind fan: a bronze four-bladed wheel on a stone stand, still or turned a quarter. */
function fan(turn: number): Raster {
  const r = createRaster(18, 28);
  ellipse(r, 9, 25, 6, 2, () => [0, 0, 0, 90]);
  rect(r, 6, 14, 6, 11, STONE_DARK);
  rect(r, 6, 14, 4, 11, STONE);
  rect(r, 6, 14, 1, 11, STONE_LIGHT);
  const cx = 9;
  const cy = 9;
  const blades: readonly (readonly [number, number])[] =
    turn % 2 === 0
      ? [
          [0, -6],
          [6, 0],
          [0, 6],
          [-6, 0],
        ]
      : [
          [4, -4],
          [4, 4],
          [-4, 4],
          [-4, -4],
        ];
  for (const [dx, dy] of blades) {
    line(r, cx, cy, cx + dx, cy + dy, BRONZE_DARK);
    line(r, cx + Math.sign(dy), cy - Math.sign(dx), cx + dx, cy + dy, BRONZE);
    ellipse(r, cx + dx * 0.8, cy + dy * 0.8, 1.6, 1.6, BRONZE_LIGHT);
  }
  ellipse(r, cx, cy, 2, 2, BRONZE_LIGHT);
  return outline(r, INK, 1);
}

/** The raft with a mast and a square sail, slack or filled. */
function sailRaft(filled: boolean): Raster {
  const deck = raft();
  const r = createRaster(deck.w, deck.h + 14);
  blit(r, deck, 0, 14);
  rect(r, 16, 4, 2, 26, MAST);
  const bulge = filled ? 3 : 0;
  rect(r, 7, 5, 20, 12, SAIL_SHADE);
  rect(r, 7, 5, 20 - bulge, 11 - (filled ? 0 : 2), SAIL);
  line(r, 7, 5, 26, 5, MAST);
  return r;
}

const EEL = hex('#3e5a52');
const EEL_LIGHT = hex('#6f8f7c');
const EEL_BELLY = hex('#b8c49a');
const EEL_EYE = hex('#e8f070');
const MAW = hex('#6a1e24');
const WATER_RING: Rgba = [170, 210, 220, 200];
const IRON = hex('#3c3c44');
const IRON_LIGHT = hex('#6a6a76');
const BUBBLE: Rgba = [200, 236, 244, 220];

type EelPose = 'under' | 'tell' | 'bite' | 'sink' | 'stunned';

/**
 * Hrönn, the great eel: a thick neck rising out of a ring of water, a blunt head with pale eyes. Up a
 * little in the tell, high with its jaws wide in the bite, flat on the stone when stunned, and only a dark
 * shape under the water otherwise.
 */
function eel(pose: EelPose): Raster {
  const r = createRaster(48, 48);
  ellipse(r, 24, 42, 14, 3, () => WATER_RING);
  ellipse(r, 24, 42, 11, 2, () => [24, 44, 52, 220]);
  if (pose === 'under' || pose === 'sink') {
    ellipse(r, 24, 42, 9, 1.5, () => [40, 70, 66, 200]);
    if (pose === 'sink') line(r, 12, 41, 36, 41, WATER_RING);
    return r;
  }
  if (pose === 'stunned') {
    ellipse(r, 24, 40, 16, 4, () => EEL);
    ellipse(r, 24, 39, 15, 2, () => EEL_LIGHT);
    ellipse(r, 36, 38, 6, 4, () => EEL);
    line(r, 35, 36, 37, 38, EEL_EYE);
    line(r, 37, 36, 35, 38, EEL_EYE);
    return outline(r, INK, 1);
  }
  const top = pose === 'bite' ? 6 : 20;
  rect(r, 18, top + 8, 12, 43 - top - 8, EEL);
  rect(r, 21, top + 8, 5, 43 - top - 8, EEL_BELLY);
  rect(r, 18, top + 8, 2, 43 - top - 8, EEL_LIGHT);
  ellipse(r, 24, top + 6, 9, 7, () => EEL);
  ellipse(r, 24, top + 4, 7, 4, () => EEL_LIGHT);
  rect(r, 19, top + 3, 2, 2, EEL_EYE);
  rect(r, 27, top + 3, 2, 2, EEL_EYE);
  if (pose === 'bite') {
    ellipse(r, 24, top + 10, 6, 4, () => MAW);
    for (const x of [20, 23, 26, 29]) rect(r, x - 1, top + 7, 1, 2, [240, 236, 220, 255]);
  }
  return outline(r, INK, 1);
}

/** One of Hrönn's iron grates in the floor, with bubbles rising through it while the eel lies under. */
function grate(bubbles: number | null): Raster {
  const r = createRaster(28, 24);
  rect(r, 3, 8, 22, 13, [16, 24, 28, 255]);
  for (let x = 4; x < 25; x += 4) rect(r, x, 8, 2, 13, IRON);
  rect(r, 3, 8, 22, 2, IRON_LIGHT);
  rect(r, 3, 19, 22, 2, IRON);
  if (bubbles !== null)
    for (const [x, y] of bubbles === 0
      ? [
          [8, 6],
          [16, 4],
          [21, 6],
        ]
      : [
          [11, 4],
          [18, 6],
          [6, 4],
        ])
      ellipse(r, x ?? 0, y ?? 0, 1.5, 1.5, () => BUBBLE);
  return outline(r, INK, 1);
}

const HORSE = hex('#4a6670');
const HORSE_LIGHT = hex('#7c98a0');
const HORSE_DARK = hex('#2c3e46');
const MANE = hex('#2e5a3a');
const BRIDLE = hex('#6a4a2a');
const HORSE_EYE = hex('#f0f4c0');
const FOAM: Rgba = [226, 242, 246, 230];

type HorsePose = 'rise' | 'swim' | 'rear' | 'wave' | 'beached' | 'charge' | 'whirl';

/**
 * Nykr, the Tide: a grey-green water horse, its weed mane streaming and a rotten bridle on its head, out of a
 * ring of water. `side` turns it to face east. Rearing it stands tall with its forelegs up; beached it lies
 * on its side on the stone; whirling, foam rings it round.
 */
function horse(pose: HorsePose, side: boolean, frame: number): Raster {
  const r = createRaster(60, 60);
  const cx = 30;
  const water = pose !== 'beached';
  if (water) {
    ellipse(r, cx, 52, 22, 4, () => WATER_RING);
    ellipse(r, cx, 52, 18, 3, () => [24, 44, 52, 220]);
  }
  if (pose === 'whirl' || pose === 'wave')
    for (let i = 0; i < 6; i++) {
      const x = 10 + i * 8 + (frame % 2) * 4;
      rect(r, x, 49 + (i % 2) * 4, 3, 1, FOAM);
    }
  if (pose === 'beached') {
    ellipse(r, cx, 46, 22, 8, () => HORSE);
    ellipse(r, cx, 43, 20, 4, () => HORSE_LIGHT);
    ellipse(r, cx + 18, 38, 8, 6, () => HORSE);
    for (let x = 10; x < 46; x += 5) line(r, x, 38, x - 2, 34, MANE);
    line(r, cx + 15, 35, cx + 19, 39, HORSE_EYE);
    line(r, cx + 19, 35, cx + 15, 39, HORSE_EYE);
    return outline(r, INK, 1);
  }
  const tall = pose === 'rear' ? 6 : pose === 'rise' ? 18 : pose === 'charge' ? 16 : 12;
  // The neck and chest out of the water.
  rect(r, cx - 9, tall + 14, 18, 52 - tall - 14, HORSE);
  rect(r, cx - 9, tall + 14, 4, 52 - tall - 14, HORSE_LIGHT);
  rect(r, cx + 5, tall + 14, 4, 52 - tall - 14, HORSE_DARK);
  // The head: long, and turned east when side-on.
  const hx = side ? cx + 6 : cx;
  ellipse(r, hx, tall + 8, side ? 12 : 8, 8, () => HORSE);
  ellipse(r, hx, tall + 6, side ? 10 : 6, 4, () => HORSE_LIGHT);
  if (side) rect(r, hx + 4, tall + 9, 8, 5, HORSE_DARK);
  else rect(r, hx - 4, tall + 12, 8, 4, HORSE_DARK);
  line(r, hx - 7, tall + 10, hx + 7, tall + 10, BRIDLE);
  rect(r, hx - 6, tall + 5, 2, 2, HORSE_EYE);
  if (!side) rect(r, hx + 4, tall + 5, 2, 2, HORSE_EYE);
  // Ears, and the weed mane down the neck.
  line(r, hx - 5, tall + 1, hx - 7, tall - 3, HORSE_DARK);
  line(r, hx + 3, tall + 1, hx + 5, tall - 3, HORSE_DARK);
  for (let y = tall + 12; y < 48; y += 4) line(r, cx - 10, y, cx - 14 - (frame % 2), y + 3, MANE);
  if (pose === 'rear')
    for (const dx of [-8, 8]) {
      line(r, cx + dx, 36, cx + dx * 1.6, 26, HORSE);
      rect(r, cx + dx * 1.6 - 1, 24, 3, 3, HORSE_DARK);
    }
  return outline(r, INK, 1);
}

const PINE = hex('#c89a5c');
const PINE_DARK = hex('#8a6434');

/** One tile of Oddr's skiff (16×16), new pine on the water: laid three in a row it makes the boat. */
function skiff(): Raster {
  const r = createRaster(16, 16);
  rect(r, 2, 6, 12, 6, PINE_DARK);
  rect(r, 2, 6, 12, 2, PINE);
  rect(r, 2, 10, 12, 1, PINE);
  rect(r, 7, 7, 2, 4, PINE_DARK);
  line(r, 2, 13, 13, 13, WATER_RING);
  return outline(r, INK, 1);
}

const SILK: Rgba = [222, 226, 232, 230];
const SILK_FAINT: Rgba = [200, 206, 214, 140];

/** The web across Myrkviðr's way (18×32, a gate tile): thick grey silk; `torn`, only rags at the edges. */
function web(torn: boolean): Raster {
  const r = createRaster(18, 32);
  if (torn) {
    for (const [x0, y0, x1, y1] of [
      [1, 16, 4, 22],
      [1, 20, 3, 26],
      [16, 17, 13, 23],
      [16, 22, 14, 28],
    ] as const)
      line(r, x0, y0, x1, y1, SILK_FAINT);
    return r;
  }
  for (const [x0, y0, x1, y1] of [
    [1, 16, 16, 30],
    [16, 16, 1, 30],
    [9, 16, 9, 30],
    [1, 23, 16, 23],
  ] as const)
    line(r, x0, y0, x1, y1, SILK);
  for (const k of [3, 6]) {
    line(r, 9 - k, 23, 9, 23 - k, SILK_FAINT);
    line(r, 9, 23 - k, 9 + k, 23, SILK_FAINT);
    line(r, 9 + k, 23, 9, 23 + k, SILK_FAINT);
    line(r, 9, 23 + k, 9 - k, 23, SILK_FAINT);
  }
  return r;
}

/** A drowned thrall: bloated grey-green, weed in the hair, a rag of a tunic. */
const DROWNED_LOOK: Look = {
  skin: '#8fa496',
  hair: '#3a5a3e',
  hairStyle: 'long',
  top: '#4a5a50',
  legs: 'pants',
  bottom: '#2e3a34',
};
const DROWNED_EYES = '#d8ffe8';

export function hofFrames(): SpriteFrame[] {
  const frames: SpriteFrame[] = [];
  for (const side of ['s', 'n', 'w'] as const) {
    const d = (anim: string, i: number, raster: Raster): void => {
      frames.push({ name: `enemy_drowned_${anim}_${side}_${String(i)}`, raster, ox: 16, oy: 30 });
      if (side === 'w')
        frames.push({ name: `enemy_drowned_${anim}_e_${String(i)}`, raster: flipX(raster), ox: 16, oy: 30 });
    };
    const eyes = DROWNED_EYES;
    [22, 16, 10, 4].forEach((sink, i) => {
      d('rise', i, sunk(DROWNED_LOOK, side, sink, eyes));
    });
    d('idle', 0, drawPerson(DROWNED_LOOK, side, 0, { eyes }));
    d('sleep', 0, sunk(DROWNED_LOOK, side, 24, eyes));
    for (let i = 0; i < 4; i++) d('walk', i, drawPerson(DROWNED_LOOK, side, i, { eyes }));
    d('tell', 0, drawPerson(DROWNED_LOOK, side, 0, { eyes, arms: 'up' }));
    d('tell', 1, drawPerson(DROWNED_LOOK, side, 1, { eyes, arms: 'up' }));
    d('swing', 0, drawPerson(DROWNED_LOOK, side, 0, { eyes, arms: 'forward' }));
    d('swing', 1, drawPerson(DROWNED_LOOK, side, 2, { eyes, arms: 'forward' }));
    d('hurt', 0, drawPerson(DROWNED_LOOK, side, 2, { eyes }));
  }
  const poses: readonly [string, HorsePose, number][] = [
    // `idle` is the pose it spawns in, for the tick before it rises.
    ['idle', 'rise', 0],
    ['rise', 'rise', 0],
    ['swim', 'swim', 0],
    ['swim', 'swim', 1],
    ['rear', 'rear', 0],
    ['wave', 'wave', 0],
    ['beached', 'beached', 0],
    ['charge', 'charge', 0],
    ['whirl', 'whirl', 0],
    ['whirl', 'whirl', 1],
  ];
  const seen = new Map<string, number>();
  for (const [anim, pose, frame] of poses) {
    const i = seen.get(anim) ?? 0;
    seen.set(anim, i + 1);
    const front = horse(pose, false, frame);
    const side = horse(pose, true, frame);
    frames.push(
      { name: `enemy_nykr_${anim}_s_${String(i)}`, raster: front, ox: 30, oy: 54 },
      { name: `enemy_nykr_${anim}_n_${String(i)}`, raster: front, ox: 30, oy: 54 },
      { name: `enemy_nykr_${anim}_e_${String(i)}`, raster: side, ox: 30, oy: 54 },
      { name: `enemy_nykr_${anim}_w_${String(i)}`, raster: flipX(side), ox: 30, oy: 54 },
    );
  }
  for (const dir of ALL) {
    // `idle` (under its grate) is the pose it spawns in, for the tick before it wakes.
    for (const [name, pose] of [
      ['idle', 'under'],
      ['under', 'under'],
      ['tell', 'tell'],
      ['bite', 'bite'],
      ['sink', 'sink'],
      ['stunned', 'stunned'],
    ] as const) {
      const raster = eel(pose);
      frames.push({
        name: `enemy_hronn_${name}_${dir}_0`,
        raster: dir === 'e' ? flipX(raster) : raster,
        ox: 24,
        oy: 44,
      });
    }
    frames.push(
      { name: `enemy_hronn_grate_idle_${dir}_0`, raster: grate(null), ox: 14, oy: 20 },
      { name: `enemy_hronn_grate_bubble_${dir}_0`, raster: grate(0), ox: 14, oy: 20 },
      { name: `enemy_hronn_grate_bubble_${dir}_1`, raster: grate(1), ox: 14, oy: 20 },
    );
  }
  for (let i = 0; i < 2; i++) {
    const side = gustSide(i);
    const up = gustUp(i);
    frames.push(
      { name: `fx_vindr_blow_e_${String(i)}`, raster: side, ox: 11, oy: 10 },
      { name: `fx_vindr_blow_w_${String(i)}`, raster: flipX(side), ox: 11, oy: 10 },
      { name: `fx_vindr_blow_n_${String(i)}`, raster: up, ox: 7, oy: 14 },
      { name: `fx_vindr_blow_s_${String(i)}`, raster: flipY(up), ox: 7, oy: 14 },
    );
  }
  frames.push({ name: 'fix_skiff_idle_s_0', raster: skiff(), ox: 8, oy: 14 });
  frames.push(
    { name: 'fix_web_closed_s_0', raster: web(false), ox: 9, oy: 31 },
    { name: 'fix_web_open_s_0', raster: web(true), ox: 9, oy: 31 },
  );
  frames.push({ name: 'fix_fan_off_s_0', raster: fan(0), ox: 9, oy: 25 });
  for (let i = 0; i < 2; i++)
    frames.push({ name: `fix_fan_on_s_${String(i)}`, raster: fan(i), ox: 9, oy: 25 });
  frames.push(
    { name: 'fix_sailraft_idle_s_0', raster: sailRaft(false), ox: 17, oy: 45 },
    { name: 'fix_sailraft_idle_s_1', raster: sailRaft(true), ox: 17, oy: 45 },
  );
  return frames;
}

const ALL: readonly Dir4[] = ['s', 'n', 'w', 'e'];
const one = (frames: number, fps: number): AnimDef => ({ frames, fps, loop: true, dirs: ['s'] });

const a = (frames: number, fps: number, loop = true): AnimDef => ({ frames, fps, loop, dirs: ALL });

export const HOF_ANIMS: Readonly<Record<string, Readonly<Record<string, AnimDef>>>> = {
  fix_web: { closed: one(1, 1), open: one(1, 1) },
  enemy_drowned: {
    idle: a(1, 1),
    hurt: a(1, 1),
    walk: a(4, 4),
    rise: a(4, 6, false),
    sleep: a(1, 1),
    tell: a(2, 6),
    swing: a(2, 12, false),
  },
  enemy_nykr: {
    idle: a(1, 1),
    rise: a(1, 1),
    swim: a(2, 4),
    rear: a(1, 1),
    wave: a(1, 1),
    beached: a(1, 1),
    charge: a(1, 1),
    whirl: a(2, 8),
  },
  enemy_hronn: {
    idle: a(1, 1),
    under: a(1, 1),
    tell: a(1, 1),
    bite: a(1, 1),
    sink: a(1, 1),
    stunned: a(1, 1),
  },
  enemy_hronn_grate: { idle: a(1, 1), bubble: a(2, 6) },
  fx_vindr: { blow: { frames: 2, fps: 10, loop: true, dirs: ALL } },
  fix_skiff: { idle: one(1, 1) },
  fix_fan: { off: one(1, 1), on: one(2, 12) },
  fix_sailraft: { idle: one(2, 3) },
};
