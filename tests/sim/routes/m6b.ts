import type { GameState } from '@core/state/gameState';
import { expect } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import type { EnemyId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import type { Entity } from '@core/actors/entity';
import type { Action } from '@core/input/actions';
import type { Dir4 } from '@core/math/dir';
import { dungeonOf } from '@core/state/dungeons';
import { Harness, frameOf } from '../harness';
import { crossTo, face, fightNear, finishStory, heroTile, walkFighting, walkTo } from '../walk';

const KEY: Readonly<Record<Dir4, Action>> = { n: 'up', s: 'down', e: 'right', w: 'left' };
const AWAY: Readonly<Record<Dir4, Action>> = { n: 'down', s: 'up', e: 'left', w: 'right' };

function alive(h: Harness): void {
  expect(h.sim.mode, `fell on ${h.sim.screen.id}`).not.toBe('over');
  h.expectAnims();
}

/** Drinks the red mead from the menu's action when health runs low (the walker cannot open menus). */
function drinkIfLow(h: Harness): void {
  if (h.sim.hero.hp <= 10 && (h.sim.state.inv.items.mead_red ?? 0) > 0) {
    h.sim.command({ t: 'eat', item: 'mead_red' });
    h.idle(1);
  }
}

/** Picks up the hearts foes and pots left on the screen. */
function gather(h: Harness): void {
  for (let i = 0; i < 8; i++) {
    const want = h.sim.actors.find(
      (a) => a.kind === 'pickup' && a.def === 'heart' && h.sim.hero.hp < h.sim.hero.maxHp,
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
  // A fight on the threshold can leave Ask off the doorway's line: step back onto it before crossing.
  fightNear(h);
  walkTo(h, tx, ty);
  crossTo(h, dir, to);
  if (h.sim.mode === 'story') finishStory(h);
  alive(h);
}

/** Stands on (tx, ty), turns to `dir` and interacts (a chest, a rack, a stone), reading to the end. */
function useAt(h: Harness, tx: number, ty: number, dir: Dir4): void {
  walkFighting(h, tx, ty);
  face(h, dir);
  h.step(frameOf([], ['interact']));
  h.idle(2);
  if (h.sim.mode === 'story') finishStory(h);
}

/** Walks into a locked door (standing on (tx, ty)) until it opens and Ask is through to `to`. */
function unlock(h: Harness, tx: number, ty: number, dir: Dir4, to: ScreenId): void {
  walkFighting(h, tx, ty);
  crossTo(h, dir, to, 900);
  alive(h);
}

/** Fights until nothing mortal is left on the screen (a `clear` room). */
function clearRoom(h: Harness): void {
  for (let round = 0; round < 40; round++) {
    drinkIfLow(h);
    const foes = h.sim.enemies.filter((e) => !h.sim.db.enemies[e.def as EnemyId].immortal);
    if (foes.length === 0) return;
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

/** Stands on (tx, ty) facing `dir` and fires the grapple (slot K) at a post, riding the pull to its end. */
function pull(h: Harness, tx: number, ty: number, dir: Dir4): void {
  walkFighting(h, tx, ty);
  face(h, dir);
  h.press(['item1']);
  h.until((s) => s.hero.fsm.s === 'move' && s.mode === 'play', 240);
  h.idle(2);
  alive(h);
}

const raftOf = (h: Harness): Entity | undefined =>
  h.sim.actors.find((a) => a.kind === 'fixture' && a.def === 'raft');

/** Whether Ask's feet are over the raft's 2×2 deck. */
function onDeck(h: Harness): boolean {
  const r = raftOf(h);
  if (r === undefined) return false;
  const { x, y } = h.sim.hero.pos;
  return x >= r.pos.x - 16 && x < r.pos.x + 16 && y >= r.pos.y - 30 && y < r.pos.y + 2;
}

/**
 * Waits on the bank tile (bx, by) for the raft to rest at the deck tile (dx, dy) with time to board, steps
 * aboard, and rides it to its next stop. A foe that keeps Ask off the deck only costs a wait for the next.
 */
function ride(h: Harness, bx: number, by: number, dx: number, dy: number, dir: Dir4): void {
  const deckX = dx * 16 + 16;
  const deckY = dy * 16 + 30;
  for (let tries = 0; tries < 6; tries++) {
    // Carried off on a failed landing: ride it out, then off the deck at whichever end it rests.
    h.until(() => raftOf(h)?.mem['moving'] !== 1, 600, frameOf([]));
    walkFighting(h, bx, by);
    h.until((s) => {
      const r = s.actors.find((a) => a.kind === 'fixture' && a.def === 'raft');
      return (
        r !== undefined &&
        r.mem['moving'] !== 1 &&
        (r.mem['wait'] ?? 0) > 40 &&
        Math.abs(r.pos.x - deckX) < 1 &&
        Math.abs(r.pos.y - deckY) < 1
      );
    }, 1200);
    try {
      walkTo(h, dx, dy, 40);
    } catch {
      continue;
    }
    h.until(() => raftOf(h)?.mem['moving'] === 1, 120, frameOf([]));
    if (raftOf(h)?.mem['ride'] !== 1) continue;
    h.until(() => raftOf(h)?.mem['moving'] === 0, 600, frameOf([]));
    // Straight off onto the bank ahead, before the raft rests out and sets off back with Ask still aboard.
    // A foe waiting on the landing is cut down from the deck.
    for (let t = 0; t < 600 && onDeck(h) && raftOf(h)?.mem['moving'] === 0; t++) {
      const near = h.sim.enemies.some(
        (e) => Math.abs(e.pos.x - h.sim.hero.pos.x) < 28 && Math.abs(e.pos.y - h.sim.hero.pos.y) < 28,
      );
      if (near && h.sim.hero.fsm.s === 'move') h.step(frameOf([], ['sword'])).idle(12);
      else h.step(frameOf([KEY[dir]]));
    }
    if (onDeck(h)) continue;
    // Two tiles clear of the deck, so a foe's blow on the landing cannot knock Ask back aboard.
    for (let t = 0; t < 22 && h.sim.hero.fsm.s === 'move'; t++) h.step(frameOf([KEY[dir]]));
    face(h, dir);
    alive(h);
    return;
  }
  throw new Error(`never got aboard the raft on ${h.sim.screen.id}`);
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

/** A step across the line to a foe, toward the roomier side. */
function across(h: Harness, b: { dir: Dir4; dx: number; dy: number }): Action {
  const p = h.sim.hero.pos;
  if (b.dir === 'e' || b.dir === 'w') return p.y < 11 * 16 ? 'down' : 'up';
  return p.x < 20 * 16 ? 'right' : 'left';
}

/** Steps toward lining up square with a foe (closing the smaller gap). */
function squareUp(b: { dir: Dir4; dx: number; dy: number }): Action {
  return b.dir === 'e' || b.dir === 'w' ? (b.dy > 0 ? 'down' : 'up') : b.dx > 0 ? 'right' : 'left';
}

/** One step back from a foe, or round it when a wall is at Ask's back. */
function backOff(h: Harness, b: { dir: Dir4; dx: number; dy: number }): void {
  const p = h.sim.hero.pos;
  const cornered =
    b.dir === 'n'
      ? p.y > 17 * 16
      : b.dir === 's'
        ? p.y < 4 * 16
        : b.dir === 'w'
          ? p.x > 35 * 16
          : p.x < 4 * 16;
  h.step(frameOf([cornered ? across(h, b) : AWAY[b.dir]]));
}

/** Steps in on a foe that is open to the blade and swings, square on. */
function strikeAt(h: Harness, foe: Entity): void {
  const b = bearing(h, foe);
  if (b.along > 24 || b.across > 8) {
    const held: Action[] = [];
    if (b.along > 24) held.push(KEY[b.dir]);
    if (b.across > 8) held.push(squareUp(b));
    h.step(frameOf(held));
    return;
  }
  h.step(frameOf([KEY[b.dir]], [KEY[b.dir]]));
  h.step(frameOf([], ['sword']));
}

/** Fires the grapple square at a foe. */
function hook(h: Harness, b: { dir: Dir4 }): void {
  if (h.sim.hero.facing !== b.dir) h.step(frameOf([KEY[b.dir]], [KEY[b.dir]]));
  h.step(frameOf([], ['item1']));
  h.until((s) => s.hero.fsm.s !== 'chain', 120);
}

/**
 * Fights Garmr: keeps out of its breath, steps out of a lunge's line, lines up at chain's length and hooks
 * the collar ring, then cuts at it while it reels.
 */
function garmr(h: Harness): void {
  const until = h.sim.tick + 30_000;
  while (h.sim.tick < until) {
    drinkIfLow(h);
    const g = h.sim.enemies.find((e) => e.def === 'garmr');
    if (g === undefined) return;
    if (h.sim.hero.fsm.s !== 'move') {
      h.idle(1);
      continue;
    }
    const b = bearing(h, g);
    const s = g.fsm.s;
    if (s === 'reel') strikeAt(h, g);
    else if (s === 'tell' || s === 'breath') {
      if (b.along < 64) backOff(h, b);
      else h.idle(1);
    } else if (s === 'crouch' || s === 'lunge') {
      if (b.across < 36) h.step(frameOf([across(h, b)]));
      else h.idle(1);
    } else if (s === 'sleep') h.step(frameOf([KEY[b.dir]]));
    else if (b.across > 6) h.step(frameOf([squareUp(b)]));
    else if (b.along > 84) h.step(frameOf([KEY[b.dir]]));
    else if (b.along < 48) backOff(h, b);
    else hook(h, b);
    alive(h);
  }
  throw new Error('Garmr still stands');
}

/**
 * Fights Náströnd: hooks his tower shield away when square on at chain's length, cuts at him while he
 * walks back to it bare, and keeps out of his cut and his flail's sweep.
 */
function nastrond(h: Harness): void {
  const until = h.sim.tick + 60_000;
  let last = -1;
  while (h.sim.tick < until) {
    drinkIfLow(h);
    const n = h.sim.enemies.find((e) => e.def === 'nastrond');
    if (n === undefined) return;
    if (h.sim.tick === last) h.idle(1);
    last = h.sim.tick;
    if (h.sim.hero.fsm.s !== 'move') {
      h.idle(1);
      continue;
    }
    const b = bearing(h, n);
    const s = n.fsm.s;
    const bare = n.mem['bare'] === 1;
    if (s === 'throne' || s === 'roar' || s === 'raise') {
      if (s === 'throne') h.step(frameOf([KEY[b.dir]]));
      else {
        fightNear(h, 40, 10);
        h.idle(1);
      }
      continue;
    }
    if (s === 'wind' || s === 'flail' || s === 'tell' || s === 'cut') {
      if (b.along < 72) backOff(h, b);
      else h.idle(1);
    } else if (bare && (s === 'fetch' || s === 'arm' || s === 'torn')) strikeAt(h, n);
    else if (h.sim.enemies.some((e) => e.def === 'fog_draugr') && b.along > 60) fightNear(h, 60, 20);
    else if (b.across > 6) h.step(frameOf([squareUp(b)]));
    else if (b.along > 84) h.step(frameOf([KEY[b.dir]]));
    else if (b.along < 48) backOff(h, b);
    else if (!bare) hook(h, b);
    else strikeAt(h, n);
    alive(h);
  }
  throw new Error('Náströnd still stands');
}

const d4 = (h: Harness) => dungeonOf(h.sim.state, 'd4');

/**
 * From Helgrind's gate to Náströnd's fall: the first key past the hel-hounds, the map in the fog, the
 * compass by raft, Garmr and the grapple, the chasm, Ís for good and the second key, the third over the
 * rapids, the great key behind lock C, both cells, Náströnd, Kolbeinn, and out by the rune-stone.
 */
export function playM6b(seed: number, from?: GameState): Harness {
  const h = new Harness(from === undefined ? { preset: DEV_PRESETS.d4, seed } : { state: from });
  h.idle(2);

  // In through the black wall.
  walkTo(h, 20, 5);
  h.until((s) => s.screen.id === 'd4_r01', 120, frameOf(['up']));
  h.until((s) => s.mode === 'story', 200, frameOf(['up']));
  finishStory(h);
  expect(h.sim.state.flags.st_d4_entered).toBe(true);

  // West over the bone bridge: the hel-hounds, and key 1.
  leave(h, 2, 10, 'w', 'd4_r02');
  clearRoom(h);
  useAt(h, 8, 15, 's');
  expect(d4(h).keys).toBe(1);
  leave(h, 37, 10, 'e', 'd4_r01');

  // East through the fog to the map, and on by raft to the compass.
  leave(h, 37, 10, 'e', 'd4_r03');
  useAt(h, 34, 4, 'n');
  expect(d4(h).map).toBe(true);
  leave(h, 37, 10, 'e', 'd4_r04');
  ride(h, 9, 10, 10, 10, 'e');
  useAt(h, 33, 10, 'e');
  expect(d4(h).compass).toBe(true);
  ride(h, 30, 10, 28, 10, 'w');
  leave(h, 2, 10, 'w', 'd4_r03');
  leave(h, 2, 10, 'w', 'd4_r01');

  // Key 1 opens lock A north: Garmr's hall. The grapple first, then the hound.
  unlock(h, 19, 2, 'n', 'd4_r07');
  walkTo(h, 34, 4);
  face(h, 'n');
  h.step(frameOf([], ['interact'])).idle(2);
  finishStory(h);
  expect(h.sim.state.inv.items.grapple).toBe(1);
  h.sim.command({ t: 'equip', slot: 0, item: 'grapple' });
  garmr(h);
  expect(h.sim.state.flags.st_d4_garmr).toBe(true);
  alive(h);

  // East through Garmr's shutter: the chasm, and the chain over it.
  leave(h, 37, 10, 'e', 'd4_r08');
  pull(h, 15, 10, 'e');
  expect(heroTile(h.sim)).toEqual([20, 10]);

  // Ís for good, and on the ice to the islet's key 2.
  leave(h, 37, 10, 'e', 'd4_r09');
  useAt(h, 20, 5, 'n');
  expect(h.sim.state.inv.galdr).toContain('is');
  sing(h, 29, 11, 's');
  useAt(h, 29, 13, 's');
  expect(d4(h).keys).toBe(1);

  // Over the rapids by the post to key 3, and north to the river hall.
  leave(h, 37, 10, 'e', 'd4_r10');
  pull(h, 25, 9, 'n');
  expect(heroTile(h.sim)).toEqual([25, 4]);
  useAt(h, 31, 4, 'n');
  expect(d4(h).keys).toBe(2);
  leave(h, 19, 2, 'n', 'd4_r16');

  // Onto the jetty by the post, west through the fog, a word with Tófa, and on to the hub.
  pull(h, 6, 16, 'n');
  expect(heroTile(h.sim)).toEqual([6, 11]);
  leave(h, 2, 10, 'w', 'd4_r15');
  leave(h, 19, 2, 'n', 'd4_r19');
  useAt(h, 19, 7, 'n');
  leave(h, 19, 19, 's', 'd4_r15');
  leave(h, 2, 10, 'w', 'd4_r14');
  leave(h, 2, 10, 'w', 'd4_r13');

  // Key 2 opens lock B west; over the pit by the post, and key 3 opens lock C north.
  unlock(h, 2, 10, 'w', 'd4_r12');
  pull(h, 28, 10, 'w');
  expect(heroTile(h.sim)).toEqual([23, 10]);
  unlock(h, 19, 2, 'n', 'd4_r17');
  expect(d4(h).keys).toBe(0);

  // Ice from the south shore to the great key's islet, and a word with Ulf in the cell west.
  sing(h, 10, 10, 'n');
  useAt(h, 10, 7, 'n');
  expect(d4(h).bigKey).toBe(true);
  leave(h, 2, 10, 'w', 'd4_r18');
  useAt(h, 13, 10, 'w');
  leave(h, 37, 10, 'e', 'd4_r17');

  // Back to the hub and through the great door.
  leave(h, 19, 19, 's', 'd4_r12');
  pull(h, 23, 11, 'e');
  leave(h, 37, 10, 'e', 'd4_r13');
  unlock(h, 19, 2, 'n', 'd4_r21');
  walkTo(h, 20, 16);
  nastrond(h);
  expect(h.sim.state.flags.st_thane_nastrond).toBe(true);
  h.until((sim) => sim.mode === 'play' || sim.mode === 'story', 60);
  if (h.sim.mode === 'story') finishStory(h);
  walkTo(h, 20, 12);
  h.until((sim) => sim.mode === 'story', 120, frameOf(['up']));
  finishStory(h);
  expect(h.sim.state.world.opened).toContain('d4_hc');

  // East: Kolbeinn's word, and the rune-stone back out to the gate.
  leave(h, 37, 10, 'e', 'd4_r22');
  h.until((sim) => sim.mode === 'story', 120, frameOf(['right']));
  finishStory(h);
  expect(h.sim.state.flags.st_d4_kolbeinn).toBe(true);
  useAt(h, 20, 7, 'n');
  expect(h.sim.screen.id).toBe('nif_gate');
  alive(h);
  return h;
}

/** Stands on (tx, ty) facing `dir` and sings Ís onto the still water ahead. */
function sing(h: Harness, tx: number, ty: number, dir: Dir4): void {
  walkFighting(h, tx, ty);
  face(h, dir);
  h.sim.command({ t: 'ready', galdr: 'is' });
  h.idle(1);
  h.press(['galdr']).idle(40);
  alive(h);
}
