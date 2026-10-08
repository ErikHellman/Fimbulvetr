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
import {
  crossFighting,
  crossTo,
  face,
  fightNear,
  finishStory,
  heroTile,
  walkFighting,
  walkTo,
} from '../walk';

const KEY: Readonly<Record<Dir4, Action>> = { n: 'up', s: 'down', e: 'right', w: 'left' };

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

/** Picks up the hearts foes left on the screen, while Ask is short of health. */
function gatherHearts(h: Harness): void {
  for (let i = 0; i < 6 && h.sim.hero.hp < h.sim.hero.maxHp; i++) {
    const heart = h.sim.actors.find((a) => a.kind === 'pickup' && a.def === 'heart');
    if (heart === undefined) return;
    try {
      walkTo(h, Math.floor(heart.pos.x / 16), Math.floor((heart.pos.y - 1) / 16), 600);
    } catch {
      return;
    }
    h.idle(2);
  }
}

function leave(h: Harness, tx: number, ty: number, dir: Dir4, to: ScreenId): void {
  gatherHearts(h);
  drinkIfLow(h);
  walkFighting(h, tx, ty);
  crossFighting(h, dir, to);
  if (h.sim.mode === 'story') finishStory(h);
  alive(h);
}

/** Stands on (tx, ty), turns to `dir` and interacts (a chest, a stone), reading to the end. */
function useAt(h: Harness, tx: number, ty: number, dir: Dir4): void {
  walkFighting(h, tx, ty);
  face(h, dir);
  h.step(frameOf([], ['interact']));
  h.idle(2);
  if (h.sim.mode === 'story') finishStory(h);
}

/** Stands on (tx, ty) facing `dir` and uses the item in slot K or L (the boomerang, a bomb). */
function throwFrom(h: Harness, tx: number, ty: number, dir: Dir4, slot: 'item1' | 'item2' = 'item1'): void {
  walkFighting(h, tx, ty);
  face(h, dir);
  h.press([slot]);
  h.idle(60);
}

/** Stands on (tx, ty) facing `dir` and swings (a wheel beside Ask). */
function swingAt(h: Harness, tx: number, ty: number, dir: Dir4): void {
  walkFighting(h, tx, ty);
  face(h, dir);
  h.press(['sword']);
  h.idle(20);
}

/** Walks into a locked door (standing on (tx, ty)) until it opens and Ask is through to `to`. */
function unlock(h: Harness, tx: number, ty: number, dir: Dir4, to: ScreenId): void {
  walkFighting(h, tx, ty);
  crossTo(h, dir, to, 900);
  alive(h);
}

const level = (h: Harness): number => {
  const v = h.sim.state.flags.w_d2_level;
  return typeof v === 'number' ? v : 0;
};

/** From just inside Sökkva Kvern's door to the second runestone lit. */
export function playM3b(seed: number, from?: GameState): Harness {
  const h = new Harness(from === undefined ? { preset: DEV_PRESETS.d2, seed } : { state: from });
  h.idle(2);
  expect(level(h)).toBe(0);

  // The water as found is low: west over the dry sluice floor to the cellar and its map.
  leave(h, 1, 10, 'w', 'd2_r03');
  useAt(h, 4, 5, 'n');
  expect(dungeonOf(h.sim.state, 'd2').map).toBe(true);

  // North to the grain loft: the boomerang lights both switches across the water, and key 1.
  leave(h, 19, 2, 'n', 'd2_r05');
  throwFrom(h, 12, 12, 'n');
  throwFrom(h, 27, 12, 'n');
  useAt(h, 34, 14, 'e');
  expect(dungeonOf(h.sim.state, 'd2').keys).toBe(1);

  // Back to the wheel-house; its second wheel floats the race planks, east to the island and key 2.
  leave(h, 19, 20, 's', 'd2_r03');
  leave(h, 38, 10, 'e', 'd2_r01');
  swingAt(h, 25, 7, 'n');
  expect(level(h)).toBe(1);
  leave(h, 38, 10, 'e', 'd2_r02');
  useAt(h, 20, 10, 'n');
  expect(dungeonOf(h.sim.state, 'd2').keys).toBe(2);
  alive(h);

  // Back over the planks and north to the millstone hall; key 1 opens lock A to the powder store.
  leave(h, 1, 10, 'w', 'd2_r01');
  leave(h, 19, 1, 'n', 'd2_r06');
  unlock(h, 37, 10, 'e', 'd2_r07');
  expect(dungeonOf(h.sim.state, 'd2').doors).toContain('d2_lock_a');

  // The doors slam; the draugr fall; the bombs appear. Bombs go into slot L.
  walkFighting(h, 8, 10, 4000, true);
  clearRoom(h);
  useAt(h, 20, 7, 'n');
  expect(h.sim.state.inv.items.bombs).toBe(10);
  h.sim.command({ t: 'equip', slot: 1, item: 'bombs' });
  h.idle(1);

  // The crab pen: bombs crack the mud-crabs' shells, the blade does the rest, and key 3 appears.
  leave(h, 38, 10, 'e', 'd2_r08');
  walkTo(h, 14, 10);
  crabs(h);
  clearRoom(h);
  useAt(h, 30, 6, 'n');
  expect(h.sim.state.world.opened).toContain('d2_c_key3');
  expect(dungeonOf(h.sim.state, 'd2').keys).toBe(2);
  alive(h);

  // Back to the hub; key 2 opens lock B, and the boomerang turns the great wheel over its pit: level 2.
  leave(h, 1, 10, 'w', 'd2_r07');
  leave(h, 1, 10, 'w', 'd2_r06');
  unlock(h, 19, 2, 'n', 'd2_r10');
  throwFrom(h, 30, 9, 'n');
  expect(level(h)).toBe(2);

  // Round to the tail-race, whose planks now float, and key 3 opens lock C to the big key's room.
  leave(h, 19, 20, 's', 'd2_r06');
  leave(h, 38, 10, 'e', 'd2_r07');
  leave(h, 38, 10, 'e', 'd2_r08');
  leave(h, 19, 1, 'n', 'd2_r12');
  // Draw the crab east along the landing, out of the water-worm's sight.
  walkTo(h, 33, 16);
  crabs(h);
  unlock(h, 2, 10, 'w', 'd2_r11');
  expect(dungeonOf(h.sim.state, 'd2').doors).toContain('d2_lock_c');
  walkFighting(h, 30, 12, 4000, true);
  crabs(h);
  clearRoom(h);
  useAt(h, 20, 7, 'n');
  expect(dungeonOf(h.sim.state, 'd2').bigKey).toBe(true);

  // The big lock, and Lindormr.
  unlock(h, 19, 2, 'n', 'd2_r15');
  lindormr(h);
  expect(h.sim.state.flags.st_d2_boss_dead).toBe(true);
  h.until((sim) => sim.mode === 'play' || sim.mode === 'story', 60);
  walkTo(h, 20, 15);
  h.until((sim) => sim.mode === 'story', 120, frameOf(['down']));
  finishStory(h);
  expect(h.sim.state.world.opened).toContain('d2_hc');

  // East to the second runestone.
  leave(h, 38, 10, 'e', 'd2_r16');
  useAt(h, 20, 5, 'n');
  expect(h.sim.state.flags.st_stone2_lit).toBe(true);
  expect(h.sim.screen.id).toBe('myl_mill');
  alive(h);
  return h;
}

/**
 * Fights Lindormr: bombs the mound it hides in (from beside it, then backs off), and swings at it while it
 * lies flushed out or dazed, until it dies.
 */
function lindormr(h: Harness): void {
  const until = h.sim.tick + 30_000;
  while (h.sim.tick < until) {
    drinkIfLow(h);
    const worm = h.sim.enemies.find((e) => e.def === 'lindormr');
    if (worm === undefined) return;
    const s = worm.fsm.s;
    if (s === 'flushed' || s === 'dazed') {
      strike(h, worm);
      continue;
    }
    if (pickBombs(h)) continue;
    const mound = h.sim.enemies.find((e) => e.def === 'lind_mound' && e.mem['spot'] === worm.mem['in']);
    // Wait out the rearing behind the shield; go in just after it has sunk back into its mound.
    // Go as soon as it sinks, or as soon as its ripple shows which mound it is heading for.
    const going = s === 'ripple' || (s === 'hidden' && worm.fsm.t <= 20);
    if (!going || mound === undefined) {
      // Wait in the middle of the pond, shield up toward the serpent.
      const [x, y] = heroTile(h.sim);
      if (Math.abs(x - 20) + Math.abs(y - 11) > 2 && s !== 'rear') walkTo(h, 20, 11, 400);
      guard(h, worm, 2);
      continue;
    }
    if ((h.sim.state.inv.items.bombs ?? 0) === 0) {
      pots(h);
      continue;
    }
    // From the pond's middle side of the mound, facing it; then back off the other way.
    const tx = Math.floor(mound.pos.x / 16);
    const ty = Math.floor((mound.pos.y - 1) / 16);
    const west = tx > 20;
    h.step(frameOf([], [], ['shield']));
    walkTo(h, west ? tx - 2 : tx + 2, ty, 2400);
    face(h, west ? 'e' : 'w');
    h.press(['item2']);
    h.hold([west ? 'left' : 'right'], 24);
    // Shield up toward the serpent while the fuse burns: its spit stops on the shield.
    for (let t = 0; t < 30 && h.sim.actors.some((a) => a.kind === 'prop' && a.def === 'bomb'); t++)
      guard(h, worm, 4);
    h.idle(4);
  }
  throw new Error('Lindormr still lives');
}

/** Holds the shield toward `foe` for `ticks` ticks (turning first if it has moved round). */
function guard(h: Harness, foe: Entity, ticks: number): void {
  const dx = foe.pos.x - h.sim.hero.pos.x;
  const dy = foe.pos.y - h.sim.hero.pos.y;
  const dir: Dir4 = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : dy > 0 ? 's' : 'n';
  if (h.sim.hero.facing !== dir) {
    h.step(frameOf([], [], ['shield']));
    face(h, dir);
  }
  for (let i = 0; i < ticks; i++) h.step(frameOf(['shield']));
}

/** Walks over the bombs lying about (a mound's spill). Returns whether it picked any up. */
function pickBombs(h: Harness): boolean {
  if ((h.sim.state.inv.items.bombs ?? 0) >= 10) return false;
  const b = h.sim.actors.find((a) => a.kind === 'pickup' && a.def === 'bombs');
  if (b === undefined) return false;
  try {
    walkTo(h, Math.floor(b.pos.x / 16), Math.floor((b.pos.y - 1) / 16), 400);
  } catch {
    return false;
  }
  h.idle(2);
  return true;
}

/** Swings at a foe that is open to the blade until it stirs again. */
function strike(h: Harness, foe: Entity): void {
  for (let i = 0; i < 400; i++) {
    if (!h.sim.enemies.includes(foe) || (foe.fsm.s !== 'flushed' && foe.fsm.s !== 'dazed')) return;
    const dx = foe.pos.x - h.sim.hero.pos.x;
    const dy = foe.pos.y - h.sim.hero.pos.y;
    if (h.sim.hero.fsm.s !== 'move') {
      h.idle(1);
      continue;
    }
    if (Math.abs(dy) > 8 || Math.abs(dx) > 22) {
      const held: Action[] = [];
      if (Math.abs(dx) > 22) held.push(dx > 0 ? 'right' : 'left');
      if (Math.abs(dy) > 8) held.push(dy > 0 ? 'down' : 'up');
      h.step(frameOf(held));
      continue;
    }
    const dir: Action = dx > 0 ? 'right' : 'left';
    h.step(frameOf([dir], [dir]));
    h.step(frameOf([], ['sword']));
  }
}

/** Breaks the bomb pots on the screen for the bombs inside, and picks them up. */
function pots(h: Harness): void {
  for (const pot of h.sim.actors.filter((a) => a.kind === 'prop' && a.def === 'bomb_pot')) {
    const tx = Math.floor(pot.pos.x / 16);
    const ty = Math.floor((pot.pos.y - 1) / 16);
    walkTo(h, tx, ty + 1, 1200);
    face(h, 'n');
    h.press(['sword']);
    h.idle(12);
  }
  pickBombs(h);
}

/** Fights until nothing mortal is left on the screen (a `clear` room), seeking out foes that lie low. */
function clearRoom(h: Harness): void {
  for (let round = 0; round < 60; round++) {
    drinkIfLow(h);
    crabs(h);
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

/** Bombs every mud-crab on the screen until its shell cracks, and fights it with the blade once it has. */
function crabs(h: Harness): void {
  for (let round = 0; round < 80; round++) {
    drinkIfLow(h);
    const whole = h.sim.enemies.filter((e) => e.def === 'leirkrabbi' && e.mem['cracked'] !== 1);
    const cracked = h.sim.enemies.find((e) => e.def === 'leirkrabbi' && e.mem['cracked'] === 1);
    if (cracked !== undefined) {
      // Round the pen's rails to it (the fighter only steers straight), then the blade.
      slay(h, cracked);
      continue;
    }
    const crab = whole[0];
    if (crab === undefined) return;
    if ((h.sim.state.inv.items.bombs ?? 0) === 0) {
      pots(h);
      if ((h.sim.state.inv.items.bombs ?? 0) === 0) throw new Error(`no bombs left on ${h.sim.screen.id}`);
      continue;
    }
    lure(h, crab);
  }
  throw new Error(
    `the crabs are still standing: ${JSON.stringify(h.sim.enemies.map((e) => [e.def, e.hp, e.mem['cracked'], Math.round(e.pos.x), Math.round(e.pos.y), e.fsm.s]))} hero ${heroTile(h.sim).join(',')} hp ${String(h.sim.hero.hp)} bombs ${String(h.sim.state.inv.items.bombs)}`,
  );
}

/**
 * Fights a mud-crab whose shell is cracked: shield up toward it through its tell and pinch (the shield
 * turns a pinch), and the blade while it recovers or closes in; round the pen's rails when far off.
 */
function slay(h: Harness, crab: Entity): void {
  let best = Infinity;
  let stuck = 0;
  for (let i = 0; i < 900 && h.sim.enemies.includes(crab); i++) {
    if (h.sim.mode !== 'play') return;
    const dx = crab.pos.x - h.sim.hero.pos.x;
    const dy = crab.pos.y - h.sim.hero.pos.y;
    const d = Math.hypot(dx, dy);
    // No nearer for a while (a rail between them): path round instead of steering straight.
    if (d < best - 2) {
      best = d;
      stuck = 0;
    } else stuck++;
    if (d > 64 || stuck > 40) {
      stuck = 0;
      best = Infinity;
      try {
        walkTo(h, Math.floor(crab.pos.x / 16), Math.floor((crab.pos.y - 1) / 16), 30);
      } catch {
        h.idle(2);
      }
      continue;
    }
    if (crab.fsm.s === 'tell' || crab.fsm.s === 'pinch') {
      guard(h, crab, 1);
      continue;
    }
    if (h.sim.hero.fsm.s === 'shield') h.step(frameOf([], [], ['shield']));
    if (h.sim.hero.fsm.s !== 'move') {
      h.idle(1);
      continue;
    }
    const along: Action = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    const want = Math.max(Math.abs(dx), Math.abs(dy));
    const side = Math.min(Math.abs(dx), Math.abs(dy));
    if (want > 20 || side > 8) {
      const held: Action[] = [along];
      if (side > 8)
        held.push(Math.abs(dx) > Math.abs(dy) ? (dy > 0 ? 'down' : 'up') : dx > 0 ? 'right' : 'left');
      h.step(frameOf(held));
      continue;
    }
    h.step(frameOf([along], [along]));
    h.step(frameOf([], ['sword']));
  }
}

/**
 * Closes in on a crab until it notices Ask and comes within reach, sets a bomb down between them, backs off
 * out of the blast and waits for it: the crab follows Ask onto the bomb.
 */
function lure(h: Harness, crab: Entity): void {
  const dist = (): number => Math.hypot(crab.pos.x - h.sim.hero.pos.x, crab.pos.y - h.sim.hero.pos.y);
  for (let i = 0; i < 60 && dist() > 36; i++) {
    if (!h.sim.enemies.includes(crab)) return;
    const tx = Math.floor(crab.pos.x / 16);
    const ty = Math.floor((crab.pos.y - 1) / 16);
    try {
      walkTo(h, tx, ty + 1, 8);
    } catch {
      h.idle(4);
    }
  }
  const dx = crab.pos.x - h.sim.hero.pos.x;
  const dy = crab.pos.y - h.sim.hero.pos.y;
  const toward: Dir4 = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : dy > 0 ? 's' : 'n';
  const away: Dir4 = ({ e: 'w', w: 'e', s: 'n', n: 's' } as const)[toward];
  face(h, toward);
  h.press(['item2']);
  h.hold([KEY[away]], 22);
  h.until((s) => !s.actors.some((a) => a.kind === 'prop' && a.def === 'bomb'), 200);
  h.idle(10);
}
