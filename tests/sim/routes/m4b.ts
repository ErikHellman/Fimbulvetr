import type { GameState } from '@core/state/gameState';
import { expect } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import type { EnemyId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import type { Entity } from '@core/actors/entity';
import type { Action } from '@core/input/actions';
import { DIR_VEC, type Dir4 } from '@core/math/dir';
import { SOLID } from '@core/world/collision';
import { dungeonOf } from '@core/state/dungeons';
import { Harness, frameOf } from '../harness';
import {
  crossFighting,
  crossTo,
  duel,
  face,
  fightNear,
  finishStory,
  heroTile,
  walkFighting,
  walkTo,
} from '../walk';

const KEY: Readonly<Record<Dir4, Action>> = { n: 'up', s: 'down', e: 'right', w: 'left' };
const AWAY: Readonly<Record<Dir4, Action>> = { n: 'down', s: 'up', e: 'left', w: 'right' };

function alive(h: Harness): void {
  expect(h.sim.mode, `fell on ${h.sim.screen.id}`).not.toBe('over');
  h.expectAnims();
}

/** Drinks the red mead from the menu's action when health runs low (the walker cannot open menus). */
function drinkIfLow(h: Harness): void {
  if (h.sim.hero.hp <= 8 && (h.sim.state.inv.items.mead_red ?? 0) > 0) {
    h.sim.command({ t: 'eat', item: 'mead_red' });
    h.idle(1);
  }
}

/** Picks up the hearts and arrows foes and pots left on the screen. */
function gather(h: Harness): void {
  for (let i = 0; i < 8; i++) {
    const want = h.sim.actors.find(
      (a) =>
        a.kind === 'pickup' &&
        ((a.def === 'heart' && h.sim.hero.hp < h.sim.hero.maxHp) || a.def === 'arrows'),
    );
    if (want === undefined) return;
    try {
      walkTo(h, Math.floor(want.pos.x / 16), Math.floor((want.pos.y - 1) / 16), 600);
    } catch {
      return;
    }
    h.idle(2);
  }
}

function leave(h: Harness, tx: number, ty: number, dir: Dir4, to: ScreenId): void {
  gather(h);
  drinkIfLow(h);
  walkFighting(h, tx, ty);
  crossFighting(h, dir, to);
  if (h.sim.mode === 'story') finishStory(h);
  alive(h);
}

/** Stands on (tx, ty), turns to `dir` and interacts (a chest, a stone, the gold), reading to the end. */
function useAt(h: Harness, tx: number, ty: number, dir: Dir4): void {
  walkFighting(h, tx, ty);
  face(h, dir);
  h.step(frameOf([], ['interact']));
  h.idle(2);
  if (h.sim.mode === 'story') finishStory(h);
}

/** Stands on (tx, ty) facing `dir` and looses an arrow (the bow in slot K). */
function shootFrom(h: Harness, tx: number, ty: number, dir: Dir4): void {
  walkFighting(h, tx, ty);
  face(h, dir);
  h.press(['item1']);
  h.idle(40);
}

/** Walks into a locked door (standing on (tx, ty)) until it opens and Ask is through to `to`. */
function unlock(h: Harness, tx: number, ty: number, dir: Dir4, to: ScreenId): void {
  walkFighting(h, tx, ty);
  crossTo(h, dir, to, 900);
  alive(h);
}

/** Duels the wights on the screen one by one, nearest first, and fights whatever else comes. */
function wights(h: Harness): void {
  for (let round = 0; round < 200; round++) {
    drinkIfLow(h);
    const hx = h.sim.hero.pos.x;
    const hy = h.sim.hero.pos.y;
    const near = h.sim.enemies
      .filter((e) => e.def === 'haugbui' && e.mem['asleep'] !== 1)
      .sort((a, b) => Math.hypot(a.pos.x - hx, a.pos.y - hy) - Math.hypot(b.pos.x - hx, b.pos.y - hy))[0];
    if (near === undefined) return;
    if (near.fsm.s === 'rise' || near.fsm.s === 'buried') h.idle(10);
    else if (Math.hypot(near.pos.x - hx, near.pos.y - hy) > 48)
      // Round the pits to it: the duel only steps straight.
      try {
        walkTo(h, Math.floor(near.pos.x / 16), Math.floor((near.pos.y - 1) / 16), 24);
      } catch {
        // Close enough, or it moved: look again.
      }
    else if (hemmed(h, near)) {
      // A pit lies between: round it to the open side of the wight first.
      const fx = Math.floor(near.pos.x / 16);
      const fy = Math.floor((near.pos.y - 1) / 16);
      const g = h.sim.screen.collision;
      const spot = [
        [fx, fy + 1],
        [fx, fy - 1],
        [fx + 1, fy],
        [fx - 1, fy],
      ]
        .filter(([x = 0, y = 0]) => ((g.flags[y * g.cols + x] ?? SOLID) & SOLID) === 0)
        .sort(([ax = 0, ay = 0], [bx = 0, by = 0]) => {
          const [tx, ty] = heroTile(h.sim);
          return Math.abs(ax - tx) + Math.abs(ay - ty) - (Math.abs(bx - tx) + Math.abs(by - ty));
        })[0];
      try {
        if (spot !== undefined) walkTo(h, spot[0] ?? 0, spot[1] ?? 0, 24);
      } catch {
        // It moved: look again.
      }
    } else duel(h, near, 120);
    alive(h);
  }
  throw new Error(`the wights on ${h.sim.screen.id} still stand`);
}

/** Whether the tile next to Ask toward a foe is solid (a pit's edge), so the duel's straight steps stall. */
function hemmed(h: Harness, foe: Entity): boolean {
  const d = DIR_VEC[bearing(h, foe).dir];
  const [tx, ty] = heroTile(h.sim);
  const fx = Math.floor(foe.pos.x / 16);
  const fy = Math.floor((foe.pos.y - 1) / 16);
  if (tx + d.x === fx && ty + d.y === fy) return false;
  const g = h.sim.screen.collision;
  return ((g.flags[(ty + d.y) * g.cols + tx + d.x] ?? SOLID) & SOLID) !== 0;
}

/** Fights until nothing mortal is left on the screen (a `clear` room). */
function clearRoom(h: Harness): void {
  for (let round = 0; round < 40; round++) {
    drinkIfLow(h);
    const foes = h.sim.enemies.filter((e) => !h.sim.db.enemies[e.def as EnemyId].immortal);
    if (foes.length === 0) return;
    if (foes.some((e) => e.def === 'haugbui')) {
      wights(h);
      continue;
    }
    fightNear(h, 600, 600);
    const foe = foes[0];
    if (foe !== undefined && h.sim.enemies.includes(foe))
      try {
        walkTo(h, Math.floor(foe.pos.x / 16), Math.floor((foe.pos.y - 1) / 16) + 1, 60);
      } catch {
        h.idle(10);
      }
  }
  throw new Error(`${h.sim.screen.id} is not clear`);
}

/** The way from Ask to a foe along the axis it lies furthest on, and its distance on each axis. */
function bearing(
  h: Harness,
  foe: Entity,
): { dir: Dir4; along: number; across: number; dx: number; dy: number } {
  const dx = foe.pos.x - h.sim.hero.pos.x;
  const dy = foe.pos.y - h.sim.hero.pos.y;
  const horizontal = Math.abs(dx) > Math.abs(dy);
  const dir: Dir4 = horizontal ? (dx > 0 ? 'e' : 'w') : dy > 0 ? 's' : 'n';
  return {
    dir,
    along: Math.max(Math.abs(dx), Math.abs(dy)),
    across: Math.min(Math.abs(dx), Math.abs(dy)),
    dx,
    dy,
  };
}

/** One step across a foe's line (out of a bash or charge), toward the roomier side of it. */
function sidestep(h: Harness, foe: Entity, dir: Dir4): void {
  const across: Action =
    dir === 'e' || dir === 'w'
      ? foe.pos.y < 11 * 16
        ? 'down'
        : 'up'
      : foe.pos.x < 20 * 16
        ? 'right'
        : 'left';
  h.step(frameOf([across]));
}

/** One step back from a foe, or round it toward the open side when a wall is at Ask's back. */
function backOff(h: Harness, b: { dir: Dir4; dx: number; dy: number }): void {
  const p = h.sim.hero.pos;
  const cornered =
    b.dir === 'n'
      ? p.y > 16 * 16
      : b.dir === 's'
        ? p.y < 6 * 16
        : b.dir === 'w'
          ? p.x > 33 * 16
          : p.x < 7 * 16;
  if (!cornered) {
    h.step(frameOf([AWAY[b.dir]]));
    return;
  }
  const across: Action =
    b.dir === 'n' || b.dir === 's'
      ? b.dx > 0 === p.x > 6 * 16
        ? 'left'
        : 'right'
      : b.dy > 0 === p.y > 6 * 16
        ? 'up'
        : 'down';
  h.step(frameOf([across]));
}

/** Steps in on a foe that is open to the blade and swings, square on. */
function strikeAt(h: Harness, foe: Entity): void {
  const b = bearing(h, foe);
  if (b.along > 22 || b.across > 8) {
    const held: Action[] = [];
    if (b.along > 22) held.push(KEY[b.dir]);
    if (b.across > 8)
      held.push(b.dir === 'e' || b.dir === 'w' ? (b.dy > 0 ? 'down' : 'up') : b.dx > 0 ? 'right' : 'left');
    h.step(frameOf(held));
    return;
  }
  h.step(frameOf([KEY[b.dir]], [KEY[b.dir]]));
  h.step(frameOf([], ['sword']));
}

/**
 * Fights Haugvörðr: keeps out of blade's reach so it braces to bash, steps out of the bash's line, and
 * strikes while it stands dazed by the wall or recovering.
 */
function warden(h: Harness): void {
  const until = h.sim.tick + 20_000;
  while (h.sim.tick < until) {
    drinkIfLow(h);
    const w = h.sim.enemies.find((e) => e.def === 'haugvordr');
    if (w === undefined) return;
    if (h.sim.hero.fsm.s !== 'move') {
      h.idle(1);
      continue;
    }
    const b = bearing(h, w);
    const s = w.fsm.s;
    if (s === 'dazed' || (s === 'recover' && w.fsm.t < 24)) strikeAt(h, w);
    else if (s === 'brace' || s === 'bash') {
      if (b.across < 40) sidestep(h, w, w.facing);
      else h.idle(1);
    } else if (s === 'tell' || s === 'sweep' || s === 'recover') {
      // Out of the blade's sweep, and back in as it passes.
      if (b.along < 44) h.step(frameOf([AWAY[b.dir]]));
      else h.idle(1);
    } else if (b.along > 20 || b.across > 8) {
      // Close in to draw the sweep.
      const held: Action[] = [KEY[b.dir]];
      if (b.across > 8)
        held.push(b.dir === 'e' || b.dir === 'w' ? (b.dy > 0 ? 'down' : 'up') : b.dx > 0 ? 'right' : 'left');
      h.step(frameOf(held));
    } else h.idle(1);
    alive(h);
  }
  throw new Error('the barrow-warden still stands');
}

/**
 * Fights the Haugbúi King: lines up with him on the axis he lies nearest, looses an arrow the moment his
 * crown blazes, steps out of the charge's line if it missed, and strikes while he lies fallen. His
 * archers are fought when he is far off.
 */
function king(h: Harness): void {
  const until = h.sim.tick + 40_000;
  let shot = -1;
  while (h.sim.tick < until) {
    drinkIfLow(h);
    const k = h.sim.enemies.find((e) => e.def === 'haugkonungr');
    if (k === undefined) return;
    if (h.sim.hero.fsm.s !== 'move') {
      h.idle(1);
      continue;
    }
    const b = bearing(h, k);
    const s = k.fsm.s;
    if (s === 'fallen') strikeAt(h, k);
    else if (s === 'lower' || s === 'charge') {
      // Loose at the blazing crown, once per lowering; then out of the charge's line.
      const began = h.sim.tick - k.fsm.t;
      if (s === 'lower' && shot !== began && b.across <= 10) {
        if (h.sim.hero.facing !== b.dir) h.step(frameOf([KEY[b.dir]], [KEY[b.dir]]));
        h.step(frameOf([], ['item1']));
        shot = began;
      } else if (b.across < 36) sidestep(h, k, b.dir);
      else h.idle(1);
    } else {
      // Keep off at a bow's distance and square on with him.
      const archer = h.sim.enemies.find((e) => e.def === 'bogdraugr');
      if (archer !== undefined && b.along > 90) {
        fightNear(h, 80, 30);
        const a = bearing(h, archer);
        h.step(frameOf([KEY[a.dir]]));
      } else if (b.along < 60) backOff(h, b);
      else if (b.across > 6)
        h.step(
          frameOf([
            b.dir === 'e' || b.dir === 'w' ? (b.dy > 0 ? 'down' : 'up') : b.dx > 0 ? 'right' : 'left',
          ]),
        );
      else if (b.along > 110) h.step(frameOf([KEY[b.dir]]));
      else h.idle(1);
    }
    alive(h);
  }
  throw new Error('the Haugbúi King still stands');
}

const d3 = (h: Harness) => dungeonOf(h.sim.state, 'd3');

/** From just inside Konungshaugr's door to the third runestone lit, then home by Farvegr. */
export function playM4b(seed: number, from?: GameState): Harness {
  const h = new Harness(from === undefined ? { preset: DEV_PRESETS.d3, seed } : { state: from });
  h.idle(2);
  if (h.sim.mode === 'story') finishStory(h);
  expect(h.sim.state.flags.st_d3_entered).toBe(true);

  // East over the hidden floor to the island and key 1, then back.
  leave(h, 39, 10, 'e', 'd3_r04');
  useAt(h, 20, 10, 'n');
  expect(d3(h).keys).toBe(1);
  leave(h, 0, 10, 'w', 'd3_r01');

  // North to the pillared hall, and west past a wight to the ossuary's winding hidden floor and key 2.
  leave(h, 19, 0, 'n', 'd3_r08');
  clearRoom(h);
  leave(h, 0, 10, 'w', 'd3_r07');
  wights(h);
  leave(h, 0, 10, 'w', 'd3_r06');
  // Off the hidden floor onto the landing first: the fighter only steps straight, and pits hem it in.
  walkTo(h, 4, 10, 600);
  useAt(h, 3, 6, 'n');
  expect(d3(h).keys).toBe(2);
  leave(h, 39, 10, 'e', 'd3_r07');
  leave(h, 39, 10, 'e', 'd3_r08');

  // Key 1 opens lock A east, where the barrow-warden guards the bow.
  unlock(h, 38, 10, 'e', 'd3_r09');
  walkTo(h, 6, 10);
  warden(h);
  expect(h.sim.state.flags.st_d3_warden).toBe(true);
  useAt(h, 20, 5, 'n');
  expect(h.sim.state.inv.items.bow).toBe(1);
  h.sim.command({ t: 'equip', slot: 0, item: 'bow' });

  // East: an arrow opens the eye over the pits, the bridge falls to the island, and key 3.
  leave(h, 39, 10, 'e', 'd3_r10');
  shootFrom(h, 22, 18, 'n');
  expect(h.sim.state.flags.w_d3_r10).toBe(true);
  useAt(h, 20, 8, 'e');
  expect(d3(h).keys).toBe(2);

  // Back to the hall; key 2 opens lock B north to the wights' crossroads.
  leave(h, 0, 10, 'w', 'd3_r09');
  leave(h, 0, 10, 'w', 'd3_r08');
  unlock(h, 19, 2, 'n', 'd3_r13');
  wights(h);

  // West: the second eye across the pit lowers the bridge, and key 3 opens lock C beyond.
  leave(h, 0, 10, 'w', 'd3_r12');
  shootFrom(h, 26, 6, 'w');
  expect(h.sim.state.flags.w_d3_r12).toBe(true);
  clearRoom(h);
  unlock(h, 2, 10, 'w', 'd3_r11');

  // The grave-gold: lift it and the dead wake; set it down, lay them again, and the big key appears.
  useAt(h, 20, 10, 'w');
  expect(h.sim.enemies.filter((e) => e.mem['asleep'] === 1)).toHaveLength(0);
  h.idle(20);
  h.step(frameOf([], ['interact'])).idle(20);
  clearRoom(h);
  useAt(h, 4, 10, 'w');
  expect(d3(h).bigKey).toBe(true);

  // Back to the crossroads and through the big lock to the King.
  leave(h, 39, 10, 'e', 'd3_r12');
  leave(h, 39, 10, 'e', 'd3_r13');
  unlock(h, 19, 2, 'n', 'd3_r19');
  walkTo(h, 20, 16);
  king(h);
  expect(h.sim.state.flags.st_d3_boss_dead).toBe(true);
  h.until((sim) => sim.mode === 'play' || sim.mode === 'story', 60);
  walkTo(h, 20, 12);
  h.until((sim) => sim.mode === 'story', 120, frameOf(['up']));
  finishStory(h);
  expect(h.sim.state.world.opened).toContain('d3_hc');

  // East to the third runestone: Farvegr is learned, and the barrow gives Ask back to the heath.
  leave(h, 39, 10, 'e', 'd3_r20');
  useAt(h, 20, 5, 'n');
  expect(h.sim.state.flags.st_stone3_lit).toBe(true);
  expect(h.sim.screen.id).toBe('hau_king');

  // Farvegr home to the stone circle.
  h.sim.command({ t: 'ready', galdr: 'farvegr' });
  h.idle(1);
  h.press(['galdr']);
  expect(h.sim.storyUi()?.k).toBe('warps');
  h.press(['confirm']);
  h.until((sim) => sim.mode === 'play' && sim.screen.id === 'hau_circle', 400);
  alive(h);
  return h;
}
