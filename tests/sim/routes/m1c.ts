import type { GameState } from '@core/state/gameState';
import { expect } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import type { Action } from '@core/input/actions';
import type { Dir4 } from '@core/math/dir';
import { dungeonOf } from '@core/state/dungeons';
import { Harness, frameOf } from '../harness';
import type { EnemyId } from '@content/ids';
import { TILE } from '@core/world/dims';
import {
  crossFighting,
  crossTo,
  face,
  fightNear,
  finishStory,
  interactNorth,
  walkFighting,
  walkTo,
} from '../walk';

const KEY: Readonly<Record<Dir4, Action>> = { n: 'up', s: 'down', e: 'right', w: 'left' };

/** Walks warily: root-biters rise out of the floor, so look around every few steps. */
const go = (h: Harness, tx: number, ty: number, budget = 4000): Harness =>
  walkFighting(h, tx, ty, budget, true);

/** Every leg ends with the hero standing, every entity drawable. */
function alive(h: Harness): void {
  expect(h.sim.mode, `fell on ${h.sim.screen.id}`).not.toBe('over');
  h.expectAnims();
}

/** Leans on the root block beyond tile (tx, ty) until it slides. */
function push(h: Harness, tx: number, ty: number, dir: Dir4): void {
  go(h, tx, ty);
  h.hold([KEY[dir]], 40).idle(20);
}

/** Throws the boomerang from tile (tx, ty) toward `dir` and waits for it to come back. */
function toss(h: Harness, dir: Dir4): void {
  face(h, dir);
  const slot = h.sim.state.inv.slots[0] === 'boomerang' ? 'item1' : 'item2';
  h.press([slot]);
  h.until((s) => !s.actors.some((a) => a.kind === 'projectile'), 240);
}

/** Seeks out every mortal foe in the room (waking buried ones by stepping close) and cuts it down. */
function clearRoom(h: Harness): void {
  for (let round = 0; round < 30; round++) {
    const foes = h.sim.enemies.filter((e) => !h.sim.db.enemies[e.def as EnemyId].immortal);
    const foe = foes[0];
    if (foe === undefined) return;
    const tx = Math.floor(foe.pos.x / TILE);
    const ty = Math.floor((foe.pos.y - 1) / TILE);
    try {
      go(h, tx, ty + 2, 600);
    } catch {
      go(h, tx + 2, ty, 600);
    }
    for (let i = 0; i < 20 && h.sim.enemies.includes(foe); i++) fightNear(h, 64, 120).idle(4);
  }
  throw new Error(`could not clear ${h.sim.screen.id}`);
}

/** Opens the chest north of (tx, ty + 1) and reads what it says. */
function openChest(h: Harness, tx: number, ty: number): void {
  interactNorth(h, tx, ty);
  expect(h.sim.mode, `chest at ${String(tx)},${String(ty)}`).toBe('story');
  finishStory(h);
}

/** From the mouth of Rótarhellir to the door of Rótvættr's lair. */
export function playToLair(seed: number, from?: GameState): Harness {
  const h = new Harness(from === undefined ? { preset: DEV_PRESETS.d1, seed } : { state: from });
  const d1 = () => dungeonOf(h.sim.state, 'd1');

  // East: sap, and the first key on its island.
  walkTo(h, 37, 10);
  crossTo(h, 'e', 'd1_r03');
  go(h, 19, 16);
  openChest(h, 19, 9);
  expect(d1().keys).toBe(1);
  go(h, 3, 11);
  crossFighting(h, 'w', 'd1_r01');
  alive(h);

  // North: push both roots and the west shutter opens.
  walkTo(h, 19, 2);
  crossTo(h, 'n', 'd1_r04');
  push(h, 13, 10, 'w');
  push(h, 28, 11, 'w');
  expect(d1().doors).toContain('d1_sh_r04');
  walkTo(h, 1, 10);
  crossTo(h, 'w', 'd1_r05');
  alive(h);

  // Clear the room for the second key, then lock B north.
  go(h, 33, 10);
  clearRoom(h);
  openChest(h, 20, 14);
  expect(d1().keys).toBe(2);
  go(h, 19, 1);
  h.hold(['up'], 10);
  crossTo(h, 'n', 'd1_r07');
  expect(d1().doors).toContain('d1_lock_b');
  alive(h);

  // The boomerang, and its first switch across the sap.
  go(h, 14, 12);
  openChest(h, 14, 10);
  expect(h.sim.state.inv.items.boomerang).toBe(1);
  clearRoom(h);
  go(h, 33, 8);
  toss(h, 'n');
  h.idle(2);
  expect(d1().doors).toContain('d1_sh_r07');
  go(h, 38, 10);
  crossFighting(h, 'e', 'd1_r11');
  alive(h);

  // The great door: push the root out of the western line, then both switches.
  push(h, 10, 9, 'e');
  go(h, 11, 9);
  toss(h, 'n');
  go(h, 28, 9);
  toss(h, 'n');
  h.idle(2);
  expect(d1().doors).toContain('d1_sh_boss');
  go(h, 19, 1);
  crossTo(h, 'n', 'd1_r12');
  alive(h);
  return h;
}

/** Steps aside when the ground cracks under Ask (a root spike's tell). Returns whether it did. */
function dodge(h: Harness): boolean {
  const hero = h.sim.hero.pos;
  const spike = h.sim.enemies.find(
    (e) =>
      e.def === 'root_spike' &&
      e.fsm.s === 'tell' &&
      Math.abs(e.pos.x - hero.x) < 16 &&
      Math.abs(e.pos.y - hero.y) < 16,
  );
  if (spike === undefined || h.sim.hero.fsm.s !== 'move') return false;
  const away: Action = spike.pos.x > hero.x ? 'left' : 'right';
  for (let i = 0; i < 16; i++) h.step(frameOf([away]));
  return true;
}

/** Waits up to `ticks`, dodging spikes, until `done` holds. */
function waitDodging(h: Harness, done: () => boolean, ticks: number): void {
  for (let i = 0; i < ticks && !done(); i++) if (!dodge(h)) h.idle(1);
}

/** Where each bulb is struck from: the boomerang flies west, east or south from (20, 8). */
function bulbDir(h: Harness, bulb: { pos: { x: number; y: number } }): Dir4 {
  const dx = bulb.pos.x - (20 * TILE + TILE / 2);
  return Math.abs(dx) < TILE ? 's' : dx < 0 ? 'w' : 'e';
}

/** Stuns all three bulbs, strikes the open core, and again, until Rótvættr falls. */
function fightRotvaettr(h: Harness): void {
  go(h, 20, 16);
  const core = () => h.sim.enemies.find((e) => e.def === 'rotvaettr');
  for (let round = 0; round < 40 && core() !== undefined; round++) {
    alive(h);
    const c = core();
    if (c?.fsm.s === 'open') {
      go(h, 20, 7);
      face(h, 'n');
      for (let i = 0; i < 30 && core()?.fsm.s === 'open'; i++) if (!dodge(h)) h.press(['sword']).idle(4);
      continue;
    }
    const awake = h.sim.enemies.filter((e) => e.def === 'rot_bulb' && (e.mem['stun'] ?? 0) === 0);
    if (awake.length === 0) {
      // Shut again, it waits for a bulb to wake before it can be opened.
      waitDodging(
        h,
        () => h.sim.enemies.some((e) => e.def === 'rot_bulb' && (e.mem['stun'] ?? 0) === 0),
        500,
      );
      continue;
    }
    for (const bulb of awake) {
      go(h, 20, 8);
      dodge(h);
      toss(h, bulbDir(h, bulb));
    }
    waitDodging(h, () => core()?.fsm.s === 'open', 20);
  }
  expect(core(), 'Rótvættr still stands').toBeUndefined();
}

/** The whole of D1: from its mouth to the lit stone, then out under the roots. */
export function playD1(seed: number, from?: GameState): Harness {
  const h = playToLair(seed, from);
  fightRotvaettr(h);
  expect(h.sim.state.flags.st_d1_boss_dead).toBe(true);
  // The shutter lifts; a heart container waits where the bulb stood, and the stone behind the lair.
  const max = h.sim.hero.maxHp;
  go(h, 20, 7);
  h.until((s) => s.mode === 'story', 200, frameOf(['down']));
  finishStory(h);
  expect(h.sim.hero.maxHp).toBe(max + 4);
  interactNorth(h, 20, 2);
  expect(h.sim.mode).toBe('story');
  finishStory(h);
  expect(h.sim.state.flags.st_stone1_lit).toBe(true);
  expect(h.sim.screen.id).toBe('myr_roots');
  alive(h);
  return h;
}
