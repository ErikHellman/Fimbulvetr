import { expect } from 'vitest';
import type { Action } from '@core/input/actions';
import type { Dir4 } from '@core/math/dir';
import type { GameState } from '@core/state/gameState';
import { SCREEN_COLS, SCREEN_ROWS } from '@core/world/dims';
import { SOLID } from '@core/world/collision';
import { Harness, frameOf } from '../harness';
import { fightNear, finishStory, heroTile, talkTo, walkFighting, walkTo } from '../walk';
import { alive, intoHall, leave, outOfHall, pray, travel, useAt } from './m7b';
import { bomb, pull, through, warpTo } from './m8a';

const KEY: Readonly<Record<Dir4, Action>> = { n: 'up', s: 'down', e: 'right', w: 'left' };
const STEP: Readonly<Record<Dir4, readonly [number, number]>> = {
  n: [0, -1],
  s: [0, 1],
  e: [1, 0],
  w: [-1, 0],
};
const DIRS: readonly Dir4[] = ['n', 'e', 's', 'w'];

const slideOf = (h: Harness): number => h.sim.hero.mem['slide'] ?? 0;

function glazeAt(h: Harness, x: number, y: number): boolean {
  const t = h.sim.terrainOf(h.sim.screen.id).cells[y * SCREEN_COLS + x];
  return t !== undefined && h.sim.db.terrain[t].glaze === true;
}

function solidAt(h: Harness, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= SCREEN_COLS || y >= SCREEN_ROWS) return true;
  const g = h.sim.screen.collision;
  return ((g.flags[y * g.cols + x] ?? 0) & SOLID) !== 0;
}

/** Where a move from (x, y) toward `dir` ends: one step on firm ground, or on to the slide's end on glaze. */
function moveEnd(h: Harness, x: number, y: number, dir: Dir4): readonly [number, number] | null {
  const [dx, dy] = STEP[dir];
  if (solidAt(h, x + dx, y + dy)) return null;
  if (!glazeAt(h, x, y) && !glazeAt(h, x + dx, y + dy)) return [x + dx, y + dy];
  let [px, py] = [x + dx, y + dy];
  while (glazeAt(h, px, py) && !solidAt(h, px + dx, py + dy)) [px, py] = [px + dx, py + dy];
  return [px, py];
}

/** The moves (walks and slides) from Ask's tile to (tx, ty) on this screen, by breadth-first search. */
function icePlan(h: Harness, tx: number, ty: number): Dir4[] {
  const key = (x: number, y: number): number => y * SCREEN_COLS + x;
  const [hx, hy] = heroTile(h.sim);
  const prev = new Map<number, [number, Dir4] | null>([[key(hx, hy), null]]);
  const queue: [number, number][] = [[hx, hy]];
  while (queue.length > 0) {
    const [x, y] = queue.shift() as [number, number];
    if (x === tx && y === ty) break;
    for (const d of DIRS) {
      const end = moveEnd(h, x, y, d);
      if (end === null || prev.has(key(...end))) continue;
      prev.set(key(...end), [key(x, y), d]);
      queue.push([...end]);
    }
  }
  const out: Dir4[] = [];
  for (let at = key(tx, ty); at !== key(hx, hy);) {
    const p = prev.get(at);
    if (p === undefined || p === null)
      throw new Error(`no way over the ice on ${h.sim.screen.id} to ${String(tx)},${String(ty)}`);
    out.unshift(p[1]);
    at = p[0];
  }
  return out;
}

/**
 * Crosses glaze to (tx, ty): plans walks and slides over the ice, and for each slide pushes the stick only
 * until it starts, then rides it out. Re-plans after every move (a foe or the wind may have shifted Ask).
 */
export function iceTo(h: Harness, tx: number, ty: number): void {
  for (let moves = 0; moves < 60; moves++) {
    const [hx, hy] = heroTile(h.sim);
    if (hx === tx && hy === ty) {
      if (!glazeAt(h, hx, hy)) walkTo(h, tx, ty);
      return;
    }
    const dir = icePlan(h, tx, ty)[0] as Dir4;
    const [dx, dy] = STEP[dir];
    if (!glazeAt(h, hx, hy) && !glazeAt(h, hx + dx, hy + dy)) {
      walkTo(h, hx + dx, hy + dy, 200);
      continue;
    }
    for (let t = 0; t < 40 && slideOf(h) === 0; t++) {
      const [cx, cy] = heroTile(h.sim);
      if (cx !== hx || cy !== hy) break;
      h.step(frameOf([KEY[dir]]));
    }
    h.until((s) => (s.hero.mem['slide'] ?? 0) === 0, 900);
    h.idle(2);
    alive(h);
  }
  throw new Error(`lost on the ice of ${h.sim.screen.id} at ${heroTile(h.sim).join(',')}`);
}

/** Turns toward `dir` with a tap (on glaze against a block, the slide it starts ends at once). */
export function turnTo(h: Harness, dir: Dir4): void {
  if (h.sim.hero.facing !== dir) h.step(frameOf([KEY[dir]], [KEY[dir]]));
  h.until((s) => (s.hero.mem['slide'] ?? 0) === 0, 60);
  h.idle(2);
}

/**
 * M9a: from Askdalr's village (the M8b save): a prayer at the Refuge, Farvegr to Dvergagröf and up the ledges onto Hrímfjöll in the
 * ember byrnie; over the glacier's glaze for its piece; the beacon's warp stone and Ormr's lens; Embla's third
 * letter at the Refuge and back; the saddle's ore, the crevasse by grapple and the icefall's chest; the
 * frozen tarn's chest; the cairn at the top of the world; and back to the beacon's stone.
 */
export function playM9a(from: GameState): Harness {
  const h = new Harness({ state: from });
  h.idle(2);
  h.sim.command({ t: 'equip', slot: 0, item: 'grapple' });
  h.sim.command({ t: 'equip', slot: 1, item: 'bombs' });
  h.idle(1);

  // A prayer at the Refuge's hof for seiðr enough to travel by the stones, then up from the dwarf country
  // past the frost line.
  warpTo(h, 'saevatn', 'sae_holmr');
  intoHall(h);
  pray(h);
  outOfHall(h);
  warpTo(h, 'dvergagrof', 'dvg_chasm');
  travel(h, 'hrf_road');
  h.until((s) => s.mode === 'story', 240, frameOf(['up']));
  finishStory(h);
  expect(h.sim.state.flags.st_hrf_reached).toBe(true);

  // East over the glacier, by its piece.
  leave(h, 39, 10, 'e', 'hrf_glacier');
  fightNear(h);
  iceTo(h, 17, 6);
  expect(h.sim.state.world.pieces).toContain('hp_hrf_glacier');
  iceTo(h, 38, 10);
  leave(h, 39, 10, 'e', 'hrf_beacon');

  // The beacon's warp stone, and Sindri's lens for Ormr in the hut.
  useAt(h, 20, 16, 'n');
  expect(h.sim.state.world.warps).toContain('hrimfjoll');
  through(h, 9, 7, 'n', 'hrf_int_hut');
  talkTo(h, 'ormr');
  expect(h.sim.state.flags.st_beacon_lit).toBe(true);
  expect(h.sim.state.flags.q_trade).toBe(7);
  through(h, 19, 15, 's', 'hrf_beacon');

  // Embla's third letter at the Refuge, and back.
  warpTo(h, 'saevatn', 'sae_holmr');
  intoHall(h);
  talkTo(h, 'embla');
  expect(h.sim.state.flags.q_letters).toBe(3);
  outOfHall(h);
  warpTo(h, 'hrimfjoll', 'hrf_beacon');

  // North to the saddle: a bomb for the ore in the cliff.
  travel(h, 'hrf_saddle');
  bomb(h, 30, 6, 'n');
  useAt(h, 30, 5, 'n');
  expect(h.sim.state.world.opened).toEqual(expect.arrayContaining(['hrf_k_ore', 'hrf_c_ore']));

  // West over the crevasse by the grapple, the icefall's chest among the drifts, and back.
  leave(h, 0, 10, 'w', 'hrf_crevasse');
  pull(h, 17, 11, 'w');
  leave(h, 0, 10, 'w', 'hrf_icefall');
  useAt(h, 7, 11, 'n');
  expect(h.sim.state.world.opened).toContain('hrf_c_icefall');
  leave(h, 39, 10, 'e', 'hrf_crevasse');
  pull(h, 13, 10, 'e');
  leave(h, 39, 10, 'e', 'hrf_saddle');

  // Down to the beacon and east onto the frozen tarn for its chest.
  travel(h, 'hrf_tarn');
  fightNear(h);
  iceTo(h, 19, 11);
  turnTo(h, 'w');
  h.step(frameOf([], ['interact']));
  h.idle(2);
  if (h.sim.mode === 'story') finishStory(h);
  expect(h.sim.state.world.opened).toContain('hrf_c_tarn');
  iceTo(h, 34, 10);

  // North past the tower's foot and east to the cairn: the last seiðr vessel.
  travel(h, 'hrf_cairn');
  useAt(h, 28, 11, 'n');
  expect(h.sim.state.flags.st_letter3_found).toBe(true);

  // Back to the beacon's stone.
  travel(h, 'hrf_beacon');
  walkFighting(h, 20, 16);
  return h;
}
