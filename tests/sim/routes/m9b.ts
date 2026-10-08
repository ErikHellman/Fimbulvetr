import { expect } from 'vitest';
import type { Action } from '@core/input/actions';
import { DIR_VEC, type Dir4 } from '@core/math/dir';
import type { Entity } from '@core/actors/entity';
import type { FlagId } from '@content/flags';
import type { GameState } from '@core/state/gameState';
import { dungeonOf } from '@core/state/dungeons';
import { TILE } from '@core/world/dims';
import { Harness, frameOf } from '../harness';
import { fightNear, finishStory, walkFighting, walkTo } from '../walk';
import { alive, clearRoom, intoHall, leave, outOfHall, pray, swingAt, travel, unlock, useAt } from './m7b';
import { through, warpTo } from './m8a';
import { settle, stepToward, turn } from './m8b';
import { iceTo } from './m9a';

const KEY: Readonly<Record<Dir4, Action>> = { n: 'up', s: 'down', e: 'right', w: 'left' };

const d7 = (h: Harness) => dungeonOf(h.sim.state, 'd7');
const boss = (h: Harness, id: string): Entity | undefined => h.sim.enemies.find((e) => e.def === id);
const px = (t: number): number => t * TILE + TILE / 2;
const feet = (t: number): number => t * TILE + TILE - 2;

/**
 * Stands on (tx, ty) and holds the ice mirror up (slot 1) facing `dir` until `flag` is set: the beam
 * through Ask's tile goes on the way Ask faces, onto the eye.
 */
function mirrorOnto(h: Harness, tx: number, ty: number, dir: Dir4, flag: FlagId): void {
  walkFighting(h, tx, ty);
  settle(h);
  for (let i = 0; i < 240 && h.sim.state.flags[flag] !== true; i++)
    h.step(frameOf(['item1', KEY[dir]], i === 0 ? ['item1'] : []));
  h.idle(2);
  expect(h.sim.state.flags[flag], flag).toBe(true);
  settle(h);
}

/** The same, standing where a slide over glaze has left Ask (no walking on the ice). */
function mirrorHere(h: Harness, dir: Dir4, flag: FlagId): void {
  for (let i = 0; i < 240 && h.sim.state.flags[flag] !== true; i++)
    h.step(frameOf(['item1', KEY[dir]], i === 0 ? ['item1'] : []));
  h.idle(2);
  expect(h.sim.state.flags[flag], flag).toBe(true);
}

/** Frost wisps out of the sword's reach (over a pit): stand in a wisp's line with the mirror up until it dies of its own bolt. */
function wispsBack(h: Harness, budget = 6000): void {
  for (let spent = 0; spent < budget; spent++) {
    const w = h.sim.enemies.find((e) => e.def === 'frostvaettr');
    if (w === undefined) {
      h.idle(2);
      return;
    }
    if (h.sim.mode !== 'play') {
      h.idle(1);
      continue;
    }
    const dx = w.pos.x - h.sim.hero.pos.x;
    const dy = w.pos.y - h.sim.hero.pos.y;
    const dir: Dir4 = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : dy > 0 ? 's' : 'n';
    h.step(frameOf(['item1', KEY[dir]], h.sim.hero.fsm.s === 'mirror' ? [] : ['item1']));
  }
  throw new Error(`the wisps on ${h.sim.screen.id} still fly`);
}

/**
 * Svellr: keeps off the line it scrapes and charges along, and while it stands stunned against a wall
 * comes in behind it and strikes.
 */
function svellr(h: Harness): void {
  const log: string[] = [];
  for (let spent = 0; spent < 12000; spent++) {
    const s = boss(h, 'svellr');
    if (s === undefined) return;
    if (s.fsm.t === 0)
      log.push(
        `${String(h.sim.tick)} ${s.fsm.s} ${s.facing} hp ${String(s.hp)} at ${String(Math.round(s.pos.x))},${String(Math.round(s.pos.y))} ask ${String(h.sim.hero.hp)} ${String(Math.round(h.sim.hero.pos.x))},${String(Math.round(h.sim.hero.pos.y))}`,
      );
    if (h.sim.mode === 'over') throw new Error(`Ask fell to Svellr\n${log.join('\n')}`);
    if (h.sim.mode !== 'play' || (h.sim.hero.fsm.s !== 'move' && h.sim.hero.fsm.s !== 'attack')) {
      h.idle(1);
      continue;
    }
    const v = DIR_VEC[s.facing];
    if (s.fsm.s === 'stunned') {
      // Behind it, away from the wall it struck, facing it.
      const at = { x: s.pos.x - v.x * 26, y: s.pos.y - v.y * 22 };
      if (!stepToward(h, at.x, at.y, 3)) continue;
      const back: Dir4 = s.facing;
      turn(h, back);
      h.step(frameOf([], ['sword']));
      continue;
    }
    if (s.fsm.s === 'scrape' || s.fsm.s === 'charge') {
      // Off its line, to the side with more room, and on toward the wall it will stun itself on.
      const across = v.x === 0;
      const at = across
        ? { x: s.pos.x + (s.pos.x < px(20) ? 44 : -44), y: v.y > 0 ? feet(17) : feet(4) }
        : { x: v.x > 0 ? px(35) : px(4), y: s.pos.y + (s.pos.y < feet(10) ? 44 : -44) };
      stepToward(h, at.x, at.y, 4);
      continue;
    }
    // Idle: close enough to wake it, keeping a pillar's width off its row.
    stepToward(h, px(20), feet(14), 4);
  }
  throw new Error(`Svellr still stands\n${log.slice(-40).join('\n')}`);
}

/**
 * Hrímgerðr, the Glass: stands just below her (20, 5) with the mirror up facing north, so each rime bolt
 * goes straight back into her; while she kneels, the sword. An icicle's shadow under Ask: a step aside until
 * it has fallen.
 */
function hrimgerdr(h: Harness): void {
  const log: string[] = [];
  const spot = { x: px(20), y: feet(5) };
  for (let spent = 0; spent < 30000; spent++) {
    const hg = boss(h, 'hrimgerdr');
    if (hg === undefined) return;
    if (hg.fsm.t === 0)
      log.push(
        `${String(h.sim.tick)} ${hg.fsm.s} hp ${String(hg.hp)} ask ${String(h.sim.hero.hp)} ${h.sim.hero.fsm.s}`,
      );
    if (h.sim.mode === 'over') throw new Error(`Ask fell to Hrímgerðr\n${log.join('\n')}`);
    if (h.sim.mode !== 'play') {
      h.idle(1);
      continue;
    }
    const icicle = h.sim.enemies.find(
      (e) =>
        e.def === 'icicle' &&
        e.fsm.s !== 'shatter' &&
        Math.abs(e.pos.x - spot.x) < 24 &&
        Math.abs(e.pos.y - spot.y) < 24,
    );
    const hs = h.sim.hero.fsm.s;
    if (icicle !== undefined) {
      if (hs === 'mirror') {
        h.idle(1);
        continue;
      }
      if (hs === 'move') stepToward(h, spot.x + 40, spot.y, 3);
      else h.idle(1);
      continue;
    }
    if (hg.fsm.s === 'kneel') {
      if (hs === 'mirror') {
        h.idle(1);
        continue;
      }
      if (hs !== 'move' && hs !== 'attack') {
        h.idle(1);
        continue;
      }
      if (!stepToward(h, spot.x, spot.y, 2)) continue;
      turn(h, 'n');
      h.step(frameOf([], ['sword']));
      continue;
    }
    if (hs === 'mirror') {
      h.step(frameOf(['item1', 'up']));
      continue;
    }
    if (hs !== 'move') {
      h.idle(1);
      continue;
    }
    if (!stepToward(h, spot.x, spot.y, 2)) continue;
    h.step(frameOf(['item1', 'up'], ['item1']));
  }
  throw new Error(`Hrímgerðr still stands\n${log.slice(-60).join('\n')}`);
}

/**
 * M9b: from the beacon hill (the M9a save): a prayer at the Refuge, back by Hrímfjöll's stone to the tower's
 * foot and into Hrímturn: the map over the ice, the first key in the wolf hall, the compass, the second key;
 * the first light (a prism turned with the sword) and the bars north; Svellr; the third key behind him; the
 * ice mirror and its lesson; its tests (a turn by a fixed prism, the wisps' own bolts, a beam carried over a
 * slide); lock C to the hub; the great key's vault (a prism and the mirror); lock B to the cells and Ása and
 * Bjarni; the prism walk's piece of heart; the great door and Hrímgerðr; Kolbeinn, and the rune-stone out;
 * and back to the beacon's stone.
 */
/** Each room left, with Ask's health then: shown when a walk out fails. */
const TRACE: string[] = [];
function go(h: Harness, tx: number, ty: number, dir: Dir4, to: Parameters<typeof leave>[4]): void {
  TRACE.push(`${h.sim.screen.id} hp ${String(h.sim.hero.hp)} t ${String(h.sim.tick)}`);
  try {
    leave(h, tx, ty, dir, to);
  } catch (e) {
    throw new Error(`${String(e)}\n${TRACE.join('\n')}`, { cause: e });
  }
}

export function playM9b(from: GameState): Harness {
  TRACE.length = 0;
  const h = new Harness({ state: from });
  h.idle(2);
  h.sim.command({ t: 'equip', slot: 0, item: 'bow' });
  h.sim.command({ t: 'equip', slot: 1, item: 'bombs' });
  h.idle(1);

  // A prayer at the Refuge, then back up to the tower's foot and in.
  warpTo(h, 'saevatn', 'sae_holmr');
  intoHall(h);
  pray(h);
  outOfHall(h);
  warpTo(h, 'hrimfjoll', 'hrf_beacon');
  travel(h, 'hrf_towerfoot');
  through(h, 19, 7, 'n', 'd7_r28');
  walkTo(h, 19, 16);
  h.until((s) => s.mode === 'story', 120, frameOf(['up']));
  finishStory(h);
  expect(h.sim.state.flags.st_d7_entered).toBe(true);

  // West: the map over the first glaze, the first key in the wolf hall, the compass on its ledge.
  go(h, 2, 10, 'w', 'd7_r27');
  fightNear(h);
  iceTo(h, 20, 11);
  useAt(h, 20, 11, 'n');
  expect(d7(h).map).toBe(true);
  iceTo(h, 5, 10);
  go(h, 2, 10, 'w', 'd7_r26');
  clearRoom(h);
  useAt(h, 20, 17, 'n');
  expect(d7(h).keys).toBe(1);
  go(h, 2, 10, 'w', 'd7_r25');
  fightNear(h);
  iceTo(h, 13, 6);
  useAt(h, 13, 6, 'n');
  expect(d7(h).compass).toBe(true);
  iceTo(h, 34, 10);

  // Back east past the hub to the second key.
  go(h, 37, 10, 'e', 'd7_r26');
  clearRoom(h);
  go(h, 37, 10, 'e', 'd7_r27');
  walkFighting(h, 37, 10);
  go(h, 37, 10, 'e', 'd7_r28');
  go(h, 37, 10, 'e', 'd7_r29');
  fightNear(h);
  iceTo(h, 28, 6);
  useAt(h, 28, 6, 'n');
  expect(d7(h).keys).toBe(2);
  iceTo(h, 34, 10);

  // The first light: a sword blow on the prism, and the bars north lift.
  go(h, 37, 10, 'e', 'd7_r30');
  fightNear(h);
  swingAt(h, 17, 15, 'w');
  h.idle(4);
  expect(h.sim.state.flags.st_d7_eye_r30).toBe(true);

  // Svellr.
  go(h, 19, 2, 'n', 'd7_r22');
  svellr(h);
  expect(h.sim.state.flags.st_d7_svellr).toBe(true);
  for (let i = 0; i < 300 && h.sim.mode !== 'play'; i++) h.idle(1);

  // The third key on its island behind him.
  go(h, 2, 10, 'w', 'd7_r21');
  fightNear(h);
  iceTo(h, 12, 7);
  useAt(h, 12, 7, 'w');
  expect(d7(h).keys).toBe(3);
  iceTo(h, 34, 10);
  go(h, 37, 10, 'e', 'd7_r22');

  // The ice mirror, and its lesson: stand in the beam, face the eye.
  go(h, 37, 10, 'e', 'd7_r23');
  useAt(h, 20, 11, 'n');
  expect(h.sim.state.inv.items.mirror).toBe(1);
  h.sim.command({ t: 'equip', slot: 0, item: 'mirror' });
  h.idle(1);
  useAt(h, 11, 3, 'n');
  mirrorOnto(h, 30, 13, 'e', 'st_d7_eye_r23');

  // The mirror's tests: a turn by a fixed prism, the wisps' own bolts, a beam over a slide.
  go(h, 37, 10, 'e', 'd7_r24');
  fightNear(h);
  mirrorOnto(h, 28, 8, 'w', 'st_d7_eye_r24');
  go(h, 19, 2, 'n', 'd7_r16');
  walkFighting(h, 20, 12);
  wispsBack(h);
  go(h, 2, 10, 'w', 'd7_r15');
  fightNear(h);
  iceTo(h, 20, 18);
  iceTo(h, 20, 6);
  mirrorHere(h, 'w', 'st_d7_eye_r15');
  iceTo(h, 5, 10);
  go(h, 2, 10, 'w', 'd7_r14');
  clearRoom(h);
  go(h, 2, 10, 'w', 'd7_r13');

  // Lock C to the hub, and west to the great key's vault: the prism turned, the mirror down onto the eye.
  unlock(h, 2, 10, 'w', 'd7_r12');
  useAt(h, 27, 3, 'n');
  go(h, 2, 10, 'w', 'd7_r11');
  fightNear(h);
  swingAt(h, 4, 5, 'w');
  mirrorOnto(h, 24, 5, 's', 'st_d7_eye_r11');
  useAt(h, 12, 11, 's');
  expect(d7(h).bigKey).toBe(true);
  go(h, 37, 10, 'e', 'd7_r12');
  useAt(h, 27, 3, 'n');

  // Lock B to the cells: Ása and Bjarni; and the prism walk's piece of heart.
  unlock(h, 19, 19, 's', 'd7_r20');
  go(h, 2, 10, 'w', 'd7_r19');
  useAt(h, 23, 10, 'e');
  if (h.sim.mode === 'story') finishStory(h);
  go(h, 2, 10, 'w', 'd7_r18');
  useAt(h, 23, 10, 'e');
  if (h.sim.mode === 'story') finishStory(h);
  go(h, 2, 10, 'w', 'd7_r17');
  fightNear(h);
  swingAt(h, 30, 4, 'n');
  swingAt(h, 30, 16, 's');
  mirrorOnto(h, 10, 17, 'n', 'st_d7_eye_r17');
  walkTo(h, 34, 7);
  expect(h.sim.state.world.pieces).toContain('hp_d7_beam');
  go(h, 37, 10, 'e', 'd7_r18');
  go(h, 37, 10, 'e', 'd7_r19');
  go(h, 37, 10, 'e', 'd7_r20');
  go(h, 19, 2, 'n', 'd7_r12');

  // Another drink at the forecourt's basin, the great door, and Hrímgerðr.
  useAt(h, 27, 3, 'n');
  unlock(h, 19, 2, 'n', 'd7_r04');
  hrimgerdr(h);
  expect(h.sim.state.flags.st_thane_hrimgerdr).toBe(true);
  for (let i = 0; i < 600 && h.sim.mode !== 'play'; i++) {
    if (h.sim.mode === 'story') finishStory(h);
    else h.idle(1);
  }
  if (h.sim.mode !== 'play') throw new Error(`after Hrímgerðr: ${h.sim.mode}`);
  fightNear(h);
  // The heart container: its story opens the moment Ask reaches it.
  for (let i = 0; i < 200 && !h.sim.state.world.opened.includes('d7_hc'); i++)
    stepToward(h, px(20), feet(10), 1);
  h.idle(4);
  if (h.sim.storyUi() !== null) finishStory(h);
  expect(h.sim.state.world.opened).toContain('d7_hc');
  // Kolbeinn speaks as Ask steps up to where she stood (at once, if Ask struck her down from there).
  if (h.sim.state.flags.st_d7_kolbeinn !== true) {
    walkTo(h, 20, 6);
    h.until((s) => s.mode === 'story', 120, frameOf(['up']));
    finishStory(h);
  }
  expect(h.sim.state.flags.st_d7_kolbeinn).toBe(true);
  useAt(h, 20, 3, 'n');
  h.until((s) => s.screen.id === 'hrf_towerfoot' && s.mode === 'play', 300);

  // Back to the beacon's stone.
  travel(h, 'hrf_beacon');
  walkFighting(h, 20, 16);
  alive(h);
  return h;
}
