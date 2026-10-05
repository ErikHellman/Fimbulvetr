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
  enemy_drowned: {
    idle: a(1, 1),
    hurt: a(1, 1),
    walk: a(4, 4),
    rise: a(4, 6, false),
    sleep: a(1, 1),
    tell: a(2, 6),
    swing: a(2, 12, false),
  },
  fx_vindr: { blow: { frames: 2, fps: 10, loop: true, dirs: ALL } },
  fix_fan: { off: one(1, 1), on: one(2, 12) },
  fix_sailraft: { idle: one(2, 3) },
};
