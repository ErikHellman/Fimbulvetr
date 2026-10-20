import { outline } from '@art/outline';
import type { Raster } from '@art/raster';
import type { Look } from '@art/sprites/people';
import { grid, mirror, type DrawnFrame } from '../lib/sprite';
import { GRATE, HRONN, NYKR } from './grids2';
import { EEL_PAL, GRATE_PAL, NYKR_PAL } from './palette';
import { INK, NO_GEAR, PIVOT_32, Wight } from './wights';

/**
 * Sökkva Hof's foes: the drowned thralls (the villagers' body, bloated grey-green with weed in the hair,
 * rising out of a ring of mist), Nykr the water horse out of its ring of water, and Hrönn the great eel
 * under her grates.
 */

const DROWNED_LOOK: Look = {
  skin: '#8fa496',
  hair: '#3a5a3e',
  hairStyle: 'long',
  top: '#4a5a50',
  legs: 'pants',
  bottom: '#2e3a34',
};
const DIRS = ['s', 'n', 'w', 'e'] as const;

export function hofFrames(): DrawnFrame[] {
  const out: DrawnFrame[] = [];
  const drowned = new Wight(DROWNED_LOOK, { eyes: '#d8ffe8', rise: 'mist' });
  for (const side of ['s', 'w', 'n'] as const) {
    const d = (anim: string, i: number, raster: Raster): void => {
      out.push({ name: `enemy_drowned_${anim}_${side}_${i}`, raster, pivot: PIVOT_32 });
      if (side === 'w')
        out.push({ name: `enemy_drowned_${anim}_e_${i}`, raster: mirror(raster), pivot: PIVOT_32 });
    };
    [22, 16, 10, 4].forEach((sink, i) => {
      d('rise', i, drowned.risen(side, sink, NO_GEAR));
    });
    d('idle', 0, drowned.pose(side, 0, 'down', NO_GEAR));
    d('sleep', 0, drowned.risen(side, 24, NO_GEAR));
    for (let i = 0; i < 4; i++) d('walk', i, drowned.pose(side, i, 'down', NO_GEAR));
    d('tell', 0, drowned.pose(side, 0, 'up', NO_GEAR));
    d('tell', 1, drowned.pose(side, 1, 'up', NO_GEAR));
    d('swing', 0, drowned.pose(side, 0, 'forward', NO_GEAR));
    d('swing', 1, drowned.pose(side, 2, 'forward', NO_GEAR));
    d('hurt', 0, drowned.pose(side, 2, 'down', NO_GEAR));
  }
  // Nykr: the front drawing serves south and north, the east drawing is mirrored for west.
  const horse = (key: keyof typeof NYKR): Raster => outline(grid(NYKR_PAL, NYKR[key]), INK, 1);
  const pivot = { x: 0.5, y: 54 / 60 };
  for (const [anim, i, key] of [
    ['idle', 0, 'rise'],
    ['rise', 0, 'rise'],
    ['swim', 0, 'swim0'],
    ['swim', 1, 'swim1'],
    ['rear', 0, 'rear'],
    ['wave', 0, 'wave'],
    ['beached', 0, 'beached'],
    ['charge', 0, 'charge'],
    ['whirl', 0, 'whirl0'],
    ['whirl', 1, 'whirl1'],
  ] as const) {
    const front = horse(`front_${key}`);
    const east = horse(`side_${key}`);
    out.push(
      { name: `enemy_nykr_${anim}_s_${i}`, raster: front, pivot },
      { name: `enemy_nykr_${anim}_n_${i}`, raster: front, pivot },
      { name: `enemy_nykr_${anim}_e_${i}`, raster: east, pivot },
      { name: `enemy_nykr_${anim}_w_${i}`, raster: mirror(east), pivot },
    );
  }
  const eelPivot = { x: 0.5, y: 44 / 48 };
  const gratePivot = { x: 0.5, y: 20 / 24 };
  const grates = GRATE.map((text) => outline(grid(GRATE_PAL, text), INK, 1));
  for (const dir of DIRS) {
    for (const [anim, pose] of [
      ['idle', 'under'],
      ['under', 'under'],
      ['tell', 'tell'],
      ['bite', 'bite'],
      ['sink', 'sink'],
      ['stunned', 'stunned'],
    ] as const) {
      const raster = outline(grid(EEL_PAL, HRONN[pose]), INK, 1);
      out.push({
        name: `enemy_hronn_${anim}_${dir}_0`,
        raster: dir === 'e' ? mirror(raster) : raster,
        pivot: eelPivot,
      });
    }
    grates.forEach((raster, i) => {
      out.push({
        name: i === 0 ? `enemy_hronn_grate_idle_${dir}_0` : `enemy_hronn_grate_bubble_${dir}_${i - 1}`,
        raster,
        pivot: gratePivot,
      });
    });
  }
  return out;
}
