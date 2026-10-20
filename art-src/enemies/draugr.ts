import type { GridPalette } from '@art/grid';
import { outline } from '@art/outline';
import { C } from '@art/palette';
import { createRaster, getPixel, hex, setPixel, type Raster } from '@art/raster';
import type { Look } from '@art/sprites/people';
import { ARMS_FWD_TEXT, ARMS_UP_TEXT, HEAD_TEXT, LEGS_TEXT, TORSO_TEXT, render } from '../hero/parts';
import { frame, grid, mirror, paste, type DrawnFrame } from '../lib/sprite';
import { BEARD_TEXT } from '../people/parts';
import { palette } from '../people/build';

/**
 * The draugr: a dead man in grave clothes on the villagers' drawn body, grey-skinned, bald, with eyes
 * that shine pale in the dark. It rises out of a mound of earth in four frames and sleeps in it until
 * grave-gold wakes it.
 */

type Side = 's' | 'w' | 'n';
type Arms = 'down' | 'up' | 'forward';
const SIZE = 32;
const X = 9;
const Y = 4;
const INK = hex(C.ink);
const PIVOT = { x: 0.5, y: 30 / SIZE };
const SWING = [0, 1, 0, 2] as const;

const LOOK: Look = {
  skin: '#9aab9c',
  hair: '#d9d8c8',
  hairStyle: 'bald',
  beard: '#c4c3b3',
  top: '#5d5848',
  legs: 'pants',
  bottom: '#3e3a30',
};
const DEAD_EYES = '#bfefff';

/** The hair rows of a head turned to skin: a bald crown with the hair kept at the sides and back. */
function bald(text: string): string {
  return text
    .split('\n')
    .map((row, i) => (i <= 4 ? row.replace(/[hgy]/g, (ch) => (ch === 'g' ? 'd' : i <= 2 ? 'l' : 'f')) : row))
    .join('\n');
}

/** The ink of the eyes (rows 6 and 7 of the head) turned to the dead glow. */
function deadEyes(text: string): string {
  return text
    .split('\n')
    .map((row, i) => (i === 7 || i === 8 ? row.replace(/k/g, 'E') : row))
    .join('\n');
}

const MOUND = `
..........dDDDDDDDDDDDDd........
.......dDDDDDDDDDDDDDDDDDDd.....
.....dDDDDDDDDDDDDDDDDDDDDDDd...
...dDDDDDDDDDDDDDDDDDDDDDDDDDDd.
..dddddddddddddddddddddddddddddd
`;

const pal: GridPalette = { ...palette(LOOK), E: DEAD_EYES, D: C.dirt };
const head = render(
  { s: deadEyes(bald(HEAD_TEXT.s)), w: deadEyes(bald(HEAD_TEXT.w)), n: bald(HEAD_TEXT.n) },
  pal,
);
const torso = render(TORSO_TEXT, pal);
const legs = render(LEGS_TEXT, pal);
const armsUp = render(ARMS_UP_TEXT, pal);
const armsFwd = render(ARMS_FWD_TEXT, pal);
const beard = render(BEARD_TEXT, pal);
const mound = grid({ '.': null, D: C.dirt, d: C.dirtShade }, MOUND);

const pick = <T>(list: readonly T[], i: number): T => {
  const found = list[i] ?? list[0];
  if (found === undefined) throw new Error('empty part list');
  return found;
};

function pose(side: Side, step: number, arms: Arms): Raster {
  const r = frame(SIZE);
  const bob = step % 2 === 1 ? 1 : 0;
  const behind = side === 'n';
  if (behind && arms === 'up') paste(r, armsUp.n, X - 2, Y + bob - 2);
  paste(r, pick(legs[side], step), X, Y + 20);
  paste(r, pick(torso[side], arms === 'down' ? (SWING[step] ?? 0) : 3), X, Y + 11 + bob);
  if (!behind && arms === 'up') paste(r, armsUp[side], X - 2, Y + bob - 2);
  paste(r, head[side], X, Y + bob);
  if (side !== 'n') paste(r, beard[side], X + (side === 's' ? 2 : 0), Y + 8 + bob);
  if (arms === 'forward') {
    const a = armsFwd[side];
    paste(r, a.raster, X + a.dx, Y + bob + a.dy);
  }
  return outline(r, INK, 1);
}

/** The figure sunk `sink` px into its grave, the earth heaped over what is under the ground line. */
function risen(side: Side, sink: number): Raster {
  const figure = pose(side, 0, 'up');
  const r = createRaster(SIZE, SIZE);
  for (let y = 0; y < 27; y++)
    for (let x = 0; x < SIZE; x++) {
      const sy = y - sink;
      if (sy >= 0) setPixel(r, x, y, getPixel(figure, x, sy));
    }
  paste(r, mound, 0, 25);
  return outline(r, INK, 1);
}

export function draugrFrames(): DrawnFrame[] {
  const out: DrawnFrame[] = [];
  const add = (anim: string, side: Side, i: number, raster: Raster): void => {
    out.push({ name: `enemy_draugr_${anim}_${side}_${i}`, raster, pivot: PIVOT });
    if (side === 'w') out.push({ name: `enemy_draugr_${anim}_e_${i}`, raster: mirror(raster), pivot: PIVOT });
  };
  for (const side of ['s', 'w', 'n'] as const) {
    add('idle', side, 0, pose(side, 0, 'down'));
    add('hurt', side, 0, pose(side, 2, 'down'));
    for (let i = 0; i < 4; i++) add('walk', side, i, pose(side, i, 'down'));
    [22, 16, 10, 4].forEach((sink, i) => {
      add('rise', side, i, risen(side, sink));
    });
    add('sleep', side, 0, risen(side, 22));
    add('tell', side, 0, pose(side, 0, 'up'));
    add('tell', side, 1, pose(side, 1, 'up'));
    add('swing', side, 0, pose(side, 0, 'forward'));
    add('swing', side, 1, pose(side, 2, 'forward'));
  }
  return out;
}
