import { expect } from 'vitest';
import type { Entity } from '@core/actors/entity';
import { JOTUNVORDR } from '@core/actors/enemies/jotunvordr';
import { KOLBEINN } from '@core/actors/enemies/kolbeinn';
import type { ItemId } from '@content/ids';
import type { Action } from '@core/input/actions';
import type { Dir4 } from '@core/math/dir';
import type { GameState } from '@core/state/gameState';
import { dungeonOf } from '@core/state/dungeons';
import { TILE } from '@core/world/dims';
import { Harness, frameOf } from '../harness';
import { crossTo, face, fightNear, finishStory, talkTo, walkFighting, walkTo } from '../walk';
import { alive, clearRoom, leave, sing, swingAt, travel, unlock, useAt } from './m7b';
import { bomb, pull, through } from './m8a';
import { hammerAt, settle, stepToward, turn } from './m8b';
import { iceTo } from './m9a';

const KEY: Readonly<Record<Dir4, Action>> = { n: 'up', s: 'down', e: 'right', w: 'left' };

const d8 = (h: Harness) => dungeonOf(h.sim.state, 'd8');
const boss = (h: Harness, id: string): Entity | undefined => h.sim.enemies.find((e) => e.def === id);

/** Puts `item` in slot K (it stays there until the next call). */
function hold(h: Harness, item: ItemId): void {
  if (h.sim.state.inv.slots[0] === item) return;
  h.sim.command({ t: 'equip', slot: 0, item });
  h.idle(1);
}

/** Stands on (tx, ty) facing `dir` and uses `item` from slot K, waiting `ticks` after. */
function useItem(h: Harness, item: ItemId, tx: number, ty: number, dir: Dir4, ticks = 50): void {
  hold(h, item);
  walkFighting(h, tx, ty);
  face(h, dir);
  settle(h);
  h.press(['item1']).idle(ticks);
  alive(h);
}

/** Holds the ice mirror up (slot K) on (tx, ty) facing `dir` until `flag` is set. */
function mirrorOnto(
  h: Harness,
  tx: number,
  ty: number,
  dir: Dir4,
  flag: Parameters<typeof expectFlag>[1],
): void {
  hold(h, 'mirror');
  walkFighting(h, tx, ty);
  settle(h);
  for (let i = 0; i < 240 && h.sim.state.flags[flag] !== true; i++)
    h.step(frameOf(['item1', KEY[dir]], i === 0 ? ['item1'] : []));
  h.idle(2);
  expectFlag(h, flag);
  settle(h);
}

function expectFlag(h: Harness, flag: keyof GameState['flags']): void {
  expect(h.sim.state.flags[flag], flag).toBe(true);
}

/** Each room left, with Ask's health then: shown when a walk out fails. */
const TRACE: string[] = [];
function go(h: Harness, tx: number, ty: number, dir: Dir4, to: Parameters<typeof leave>[4]): void {
  TRACE.push(
    `${h.sim.screen.id} hp ${String(h.sim.hero.hp)} seidr ${String(h.sim.state.hero.seidr)} t ${String(h.sim.tick)}`,
  );
  try {
    // Bars that open on a cleared room close again when its foes are back.
    if (h.sim.db.screens[h.sim.screen.id].things.some((t) => t.k === 'shutter' && t.opens === 'clear'))
      clearRoom(h);
    leave(h, tx, ty, dir, to);
  } catch (e) {
    throw new Error(`${String(e)}\n${TRACE.join('\n')}`, { cause: e });
  }
}

/**
 * Crosses a lava channel on row `y` from column `from` to `to` (wider than one bolt of Ís crusts): a bolt at
 * the first open lava ahead, a step onto the crust, and again until the far side.
 */
function crossWideLava(h: Harness, from: number, to: number, y: number): void {
  const dir: Dir4 = to > from ? 'e' : 'w';
  const step = to > from ? 1 : -1;
  walkFighting(h, from, y);
  for (let round = 0; round < 6; round++) {
    let open: number | null = null;
    for (let x = heroTileX(h) + step; x !== to; x += step) {
      const i = y * 40 + x;
      if (h.sim.terrainOf(h.sim.screen.id).cells[i] === 'lava' && (h.sim.crust?.get(i) ?? 0) === 0) {
        open = x;
        break;
      }
    }
    if (open === null) break;
    walkTo(h, open - step, y);
    sing(h, open - step, y, dir, 'is');
  }
  walkTo(h, to, y);
}

const heroTileX = (h: Harness): number => Math.floor(h.sim.hero.pos.x / TILE);

/** Drinks at a basin of meltwater on (tx, ty) (it spans three tiles of the north wall). */
function drink(h: Harness, tx: number, ty: number): void {
  useAt(h, tx, ty, 'n');
  if (h.sim.mode === 'story') finishStory(h);
}

/**
 * Jötunvörðr: Eldr from out of his stomp's reach thaws him; while thawed, the sword from just below him.
 * When he raises his knee, Ask steps back out of the ring.
 */
function jotunvordr(h: Harness): void {
  const log: string[] = [];
  for (let spent = 0; spent < 20000; spent++) {
    const j = boss(h, 'jotunvordr');
    if (j === undefined) return;
    if (j.fsm.t === 0)
      log.push(`${String(h.sim.tick)} ${j.fsm.s} hp ${String(j.hp)} ask ${String(h.sim.hero.hp)}`);
    if (h.sim.mode === 'over') throw new Error(`Ask fell to Jötunvörðr\n${log.join('\n')}`);
    if (h.sim.mode !== 'play' || (h.sim.hero.fsm.s !== 'move' && h.sim.hero.fsm.s !== 'attack')) {
      h.idle(1);
      continue;
    }
    const dx = j.pos.x - h.sim.hero.pos.x;
    const dy = h.sim.hero.pos.y - j.pos.y;
    if (j.fsm.s === 'raise' || j.fsm.s === 'stomp') {
      // Out of the ring, straight down.
      if (Math.hypot(dx, dy) < JOTUNVORDR.reach + 20) h.step(frameOf([dy >= 0 ? 'down' : 'up']));
      else h.idle(1);
      continue;
    }
    if (j.fsm.s === 'thawed') {
      if (!stepToward(h, j.pos.x, j.pos.y + 20, 2)) continue;
      turn(h, 'n');
      h.step(frameOf([], ['sword']));
      continue;
    }
    // Frozen: below him, out of reach, and a bolt of Eldr up at him.
    if (!stepToward(h, j.pos.x, j.pos.y + 76, 2)) continue;
    turn(h, 'n');
    if (h.sim.state.hero.seidr < h.sim.db.galdr.eldr.cost)
      throw new Error(`no seiðr for Eldr\n${log.join('\n')}`);
    h.sim.command({ t: 'ready', galdr: 'eldr' });
    h.idle(1);
    h.press(['galdr']).idle(20);
  }
  throw new Error(`Jötunvörðr still stands\n${log.slice(-40).join('\n')}`);
}

/**
 * Kolbeinn: keeps just out of his reach below him; as a blow falls, a parry, and the sword while he stands
 * staggered; at half health his rime bolts go back off the mirror, and he reels open. His draugr, if he
 * calls them, are fought down first.
 */
function kolbeinn(h: Harness): void {
  const log: string[] = [];
  hold(h, 'mirror');
  for (let spent = 0; spent < 30000; spent++) {
    const k = boss(h, 'kolbeinn_boss');
    if (k === undefined) return;
    if (k.fsm.t === 0)
      log.push(`${String(h.sim.tick)} ${k.fsm.s} hp ${String(k.hp)} ask ${String(h.sim.hero.hp)}`);
    if (h.sim.mode === 'over') throw new Error(`Ask fell to Kolbeinn\n${log.join('\n')}`);
    if (h.sim.mode !== 'play') {
      h.idle(1);
      continue;
    }
    const hs = h.sim.hero.fsm.s;
    const draugr = h.sim.enemies.find((e) => e.def === 'draugr');
    if (draugr !== undefined && k.fsm.s !== 'reel' && (k.mem['stun'] ?? 0) === 0) {
      if (hs === 'mirror') h.step(frameOf([]));
      fightNear(h, 400, 200);
      continue;
    }
    const dx = k.pos.x - h.sim.hero.pos.x;
    const dy = k.pos.y - h.sim.hero.pos.y;
    const open = k.fsm.s === 'reel' || ((k.mem['stun'] ?? 0) > 0 && k.mem['open'] === 1);
    if (k.fsm.s === 'draw') {
      const tell = (k.mem['chain'] ?? 0) === 0 ? KOLBEINN.drawTicks : KOLBEINN.chainDraw;
      if (k.fsm.t >= tell - 4) {
        if (hs === 'mirror') h.step(frameOf([]));
        for (let i = 0; i < 12; i++) h.step(frameOf(['shield'], i === 0 ? ['shield'] : []));
        h.step(frameOf([], [], ['shield']));
        continue;
      }
    }
    if (
      k.fsm.s === 'cast' ||
      k.fsm.s === 'loose' ||
      h.sim.actors.some((a) => a.kind === 'projectile' && a.def === 'bolt')
    ) {
      // Squared up on him, the mirror up toward him.
      const dir: Dir4 = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'w') : dy > 0 ? 's' : 'n';
      if (Math.min(Math.abs(dx), Math.abs(dy)) > 4 && hs !== 'mirror') {
        if (Math.abs(dx) > Math.abs(dy)) stepToward(h, h.sim.hero.pos.x, k.pos.y, 2);
        else stepToward(h, k.pos.x, h.sim.hero.pos.y, 2);
        continue;
      }
      h.step(frameOf(['item1', KEY[dir]], hs === 'mirror' ? [] : ['item1']));
      continue;
    }
    if (hs === 'mirror') {
      h.step(frameOf([]));
      continue;
    }
    if (hs !== 'move') {
      h.idle(1);
      continue;
    }
    if (open) {
      if (!stepToward(h, k.pos.x, k.pos.y + 20, 2)) continue;
      turn(h, 'n');
      h.step(frameOf([], ['sword'])).idle(10);
      continue;
    }
    // Close enough to draw his chain, below him.
    stepToward(h, k.pos.x, k.pos.y + 24, 2);
  }
  throw new Error(`Kolbeinn still stands\n${log.slice(-60).join('\n')}`);
}

/**
 * M10a: from the beacon hill (the M9b save) to Útgarðr's gate, where Halvar confesses and speaks the
 * binding-words; in through the gate hall: the map; the west wing (an arrow over the chasm, the first key,
 * the boomerang's island, a bomb through the cracked wall, the lantern's braziers, lock A, Eldr's melt,
 * the barracks, the strongroom's cache, the armoury and the west seal by arrow); the east wing (the grapple,
 * the second key, Vindr's fans, the hammer's stake, Ís over the lava, lock B, the compass, the grapple
 * again, Vindr's web and the east seal); the high wing (the glaze, Bragð on the eye in the chasm, the third
 * key, lock C and the piece of heart by the mirror, the fourth key, the mirror's eye, lock D and the high
 * seal by prism and mirror); down through the west wing to the seal hall; Jötunvörðr and the master key;
 * Kolbeinn, spared; and on to the threshold of the binding hall.
 */
export function playM10a(from: GameState): Harness {
  TRACE.length = 0;
  const h = new Harness({ state: from });
  h.idle(2);
  h.sim.command({ t: 'equip', slot: 0, item: 'bow' });
  h.sim.command({ t: 'equip', slot: 1, item: 'bombs' });
  h.idle(1);

  // Up to the gate in the ice: Halvar confesses, and speaks the words.
  travel(h, 'hrf_utgard');
  talkTo(h, 'halvar');
  expectFlag(h, 'st_utgard_open');
  through(h, 20, 6, 'n', 'd8_r36');
  h.until((s) => s.mode === 'story', 200, frameOf(['up']));
  finishStory(h);
  expectFlag(h, 'st_d8_entered');

  // The wash-hall east: the map.
  go(h, 37, 10, 'e', 'd8_r37');
  fightNear(h);
  useAt(h, 20, 7, 'n');
  if (h.sim.mode === 'story') finishStory(h);
  expect(d8(h).map).toBe(true);
  go(h, 19, 2, 'n', 'd8_r29');
  go(h, 2, 10, 'w', 'd8_r28');
  go(h, 2, 10, 'w', 'd8_r27');

  // The west door hall: an arrow over the chasm lifts the bars west; the first key south.
  fightNear(h);
  useItem(h, 'bow', 20, 8, 'n', 40);
  go(h, 19, 19, 's', 'd8_r35');
  clearRoom(h);
  useAt(h, 20, 15, 'n');
  if (h.sim.mode === 'story') finishStory(h);
  expect(d8(h).keys).toBe(1);
  go(h, 19, 2, 'n', 'd8_r27');
  go(h, 2, 10, 'w', 'd8_r26');

  // The boomerang to the island's switch, the bars south lift; a bomb through the cracked wall west.
  fightNear(h);
  useItem(h, 'boomerang', 20, 12, 'n', 60);
  go(h, 19, 19, 's', 'd8_r34');
  clearRoom(h);
  bomb(h, 2, 10, 'w');
  go(h, 2, 10, 'w', 'd8_r33');

  // The lantern lights both braziers, and the bars north lift; lock A, and Eldr melts the rime east.
  fightNear(h);
  useItem(h, 'lantern', 14, 9, 'n', 20);
  useItem(h, 'lantern', 26, 9, 'n', 20);
  go(h, 19, 2, 'n', 'd8_r25');
  clearRoom(h);
  unlock(h, 19, 2, 'n', 'd8_r17');
  sing(h, 34, 10, 'e', 'eldr');
  expectFlag(h, 'st_d8_melt_r17');
  go(h, 37, 10, 'e', 'd8_r18');
  clearRoom(h);

  // The strongroom east: a bomb on the cell's cracked wall, and the cache.
  go(h, 37, 10, 'e', 'd8_r19');
  fightNear(h);
  bomb(h, 27, 9, 'e');
  useAt(h, 31, 10, 'e');
  if (h.sim.mode === 'story') finishStory(h);
  expect(h.sim.state.world.opened).toContain('d8_c_cache');
  go(h, 2, 10, 'w', 'd8_r18');
  clearRoom(h);

  // North to the upper hall; the armoury east; the west seal by arrow over the chasm.
  go(h, 19, 2, 'n', 'd8_r10');
  clearRoom(h);
  go(h, 37, 10, 'e', 'd8_r11');
  useAt(h, 20, 7, 'n');
  if (h.sim.mode === 'story') finishStory(h);
  go(h, 2, 10, 'w', 'd8_r10');
  go(h, 2, 10, 'w', 'd8_r09');
  fightNear(h);
  useItem(h, 'bow', 12, 10, 'w', 40);
  expectFlag(h, 'st_d8_seal_w');

  // Back down through the west wing to the hub.
  go(h, 37, 10, 'e', 'd8_r10');
  go(h, 19, 19, 's', 'd8_r18');
  go(h, 2, 10, 'w', 'd8_r17');
  go(h, 19, 19, 's', 'd8_r25');
  go(h, 19, 19, 's', 'd8_r33');
  go(h, 37, 10, 'e', 'd8_r34');
  go(h, 19, 2, 'n', 'd8_r26');
  go(h, 37, 10, 'e', 'd8_r27');
  go(h, 37, 10, 'e', 'd8_r28');
  go(h, 37, 10, 'e', 'd8_r29');

  // A drink in the wash-hall; the east door hall: the second key south, the grapple over the chasm.
  go(h, 19, 19, 's', 'd8_r37');
  drink(h, 31, 3);
  go(h, 19, 2, 'n', 'd8_r29');
  go(h, 37, 10, 'e', 'd8_r30');
  fightNear(h);
  go(h, 19, 19, 's', 'd8_r38');
  clearRoom(h);
  useAt(h, 20, 15, 'n');
  if (h.sim.mode === 'story') finishStory(h);
  // The first key is spent on lock A already.
  expect(d8(h).keys).toBe(1);
  go(h, 19, 2, 'n', 'd8_r30');
  hold(h, 'grapple');
  pull(h, 24, 10, 'e');

  // Vindr spins both fans, and the bars south lift; the hammer splits the stake east; Ís over the lava.
  go(h, 37, 10, 'e', 'd8_r31');
  clearRoom(h);
  sing(h, 8, 7, 'n', 'vindr');
  sing(h, 31, 7, 'n', 'vindr');
  go(h, 19, 19, 's', 'd8_r39');
  clearRoom(h);
  hold(h, 'hammer');
  hammerAt(h, 38, 10, 'e');
  go(h, 37, 10, 'e', 'd8_r40');
  fightNear(h);
  crossWideLava(h, 9, 13, 10);
  go(h, 19, 2, 'n', 'd8_r32');

  // Lock B north; the barracks' bars; the compass west; the grapple north over the chasm.
  clearRoom(h);
  unlock(h, 19, 2, 'n', 'd8_r24');
  go(h, 2, 10, 'w', 'd8_r23');
  fightNear(h);
  go(h, 2, 10, 'w', 'd8_r22');
  fightNear(h);
  useAt(h, 20, 7, 'n');
  if (h.sim.mode === 'story') finishStory(h);
  expect(d8(h).compass).toBe(true);
  go(h, 37, 10, 'e', 'd8_r23');
  hold(h, 'grapple');
  pull(h, 19, 10, 'n');
  go(h, 19, 2, 'n', 'd8_r15');

  // Vindr tears the web east; the larder west first: the bombs, and a drink.
  fightNear(h);
  go(h, 2, 10, 'w', 'd8_r14');
  useAt(h, 20, 7, 'n');
  if (h.sim.mode === 'story') finishStory(h);
  drink(h, 4, 3);
  go(h, 37, 10, 'e', 'd8_r15');
  sing(h, 34, 10, 'e', 'vindr');
  expectFlag(h, 'st_d8_web_r15');
  go(h, 37, 10, 'e', 'd8_r16');

  // The east seal: Vindr over the chasm onto the fan.
  fightNear(h);
  sing(h, 33, 10, 'e', 'vindr');
  expectFlag(h, 'st_d8_seal_e');

  // North up the stair to the high wing: over the glaze to the door west.
  go(h, 19, 2, 'n', 'd8_r08');
  iceTo(h, 1, 10);
  crossTo(h, 'w', 'd8_r07', 300);

  // Bragð on the eye in the chasm melts the rime west; the third key in the gallery.
  fightNear(h);
  walkFighting(h, 20, 9);
  sing(h, 20, 9, 'n', 'bragd');
  expectFlag(h, 'st_d8_eye_r07');
  go(h, 2, 10, 'w', 'd8_r06');
  clearRoom(h);
  useAt(h, 20, 7, 'n');
  if (h.sim.mode === 'story') finishStory(h);
  expect(d8(h).keys).toBe(1);

  // The keep's roof: the fixed prism's light off the mirror onto the eye, and the piece of heart.
  go(h, 2, 10, 'w', 'd8_r05');
  fightNear(h);
  mirrorOnto(h, 28, 14, 'w', 'st_d8_eye_r05');
  walkTo(h, 33, 7);
  h.idle(4);
  if (h.sim.mode === 'story') finishStory(h);
  expect(h.sim.state.world.pieces).toContain('hp_d8_keep');

  // Lock C west: the fourth key; the mirror again onto the eye in its niche; lock D to the high seal.
  unlock(h, 2, 10, 'w', 'd8_r04');
  clearRoom(h);
  useAt(h, 20, 7, 'n');
  if (h.sim.mode === 'story') finishStory(h);
  expect(d8(h).keys).toBe(1);
  go(h, 2, 10, 'w', 'd8_r03');
  fightNear(h);
  mirrorOnto(h, 12, 17, 'n', 'st_d8_eye_r03');
  go(h, 2, 10, 'w', 'd8_r02');
  clearRoom(h);
  unlock(h, 2, 10, 'w', 'd8_r01');

  // The high seal: a sword blow turns the prism north, and the mirror sends the light west onto the eye.
  swingAt(h, 31, 17, 'w');
  mirrorOnto(h, 30, 5, 'w', 'st_d8_seal_n');

  // Down through the bars to the west wing, and back to the seal hall: all three burn, the rime door melts.
  go(h, 19, 19, 's', 'd8_r09');
  go(h, 37, 10, 'e', 'd8_r10');
  go(h, 19, 19, 's', 'd8_r18');
  go(h, 2, 10, 'w', 'd8_r17');
  go(h, 19, 19, 's', 'd8_r25');
  go(h, 19, 19, 's', 'd8_r33');
  go(h, 37, 10, 'e', 'd8_r34');
  go(h, 19, 2, 'n', 'd8_r26');
  go(h, 37, 10, 'e', 'd8_r27');
  go(h, 37, 10, 'e', 'd8_r28');
  go(h, 19, 2, 'n', 'd8_r20');
  drink(h, 4, 3);

  // Jötunvörðr, and the master key.
  go(h, 37, 10, 'e', 'd8_r21');
  walkTo(h, 30, 10);
  jotunvordr(h);
  expectFlag(h, 'st_d8_warden');
  clearRoom(h);
  useAt(h, 20, 15, 'n');
  if (h.sim.mode === 'story') finishStory(h);
  expect(d8(h).bigKey).toBe(true);

  // A drink, then the great lock north, and Kolbeinn.
  go(h, 2, 10, 'w', 'd8_r20');
  drink(h, 4, 3);
  go(h, 37, 10, 'e', 'd8_r21');
  unlock(h, 19, 2, 'n', 'd8_r13');
  h.until((s) => s.mode === 'story', 200, frameOf(['up']));
  finishStory(h);
  expectFlag(h, 'st_d8_kolbeinn_met');
  kolbeinn(h);
  expectFlag(h, 'st_kolbeinn_beaten');
  // He kneels, and Ask spares him (the first choice).
  for (let i = 0; i < 300 && h.sim.mode !== 'story'; i++) h.idle(1);
  finishStory(h);
  expectFlag(h, 'st_kolbeinn_spared');
  fightNear(h);
  walkTo(h, 4, 10);
  alive(h);
  return h;
}
