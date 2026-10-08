import { expect } from 'vitest';
import type { Action } from '@core/input/actions';
import type { Dir4 } from '@core/math/dir';
import type { Entity } from '@core/actors/entity';
import type { GameState } from '@core/state/gameState';
import { dungeonOf } from '@core/state/dungeons';
import { isNight } from '@core/clock/clock';
import { Harness, frameOf } from '../harness';
import { face, fightNear, finishStory, talkTo, walkFighting, walkTo } from '../walk';
import { alive, clearRoom, intoHall, leave, outOfHall, pray, sing, travel, unlock, useAt } from './m7b';
import { through, warpTo } from './m8a';

const KEY: Readonly<Record<Dir4, Action>> = { n: 'up', s: 'down', e: 'right', w: 'left' };
const BACK: Readonly<Record<Dir4, Action>> = { n: 'down', s: 'up', e: 'left', w: 'right' };

const d6 = (h: Harness) => dungeonOf(h.sim.state, 'd6');
const boss = (h: Harness, id: string): Entity | undefined => h.sim.enemies.find((e) => e.def === id);

/** Waits while the hero is busy (a swing, a song), up to `ticks`. */
export function settle(h: Harness, ticks = 120): void {
  for (let i = 0; i < ticks && (h.sim.hero.fsm.s !== 'move' || h.sim.mode !== 'play'); i++) h.idle(1);
}

/** Stands on (tx, ty) facing `dir` and brings the hammer (slot 1) down. */
export function hammerAt(h: Harness, tx: number, ty: number, dir: Dir4): void {
  walkFighting(h, tx, ty);
  face(h, dir);
  settle(h);
  h.press(['item1']).idle(h.sim.db.tuning.hero.hammerTicks + 2);
  alive(h);
}

/** Stands on (tx, ty) facing `dir` and sings Ís from a rune-stave (slot 2), keeping the seiðr. */
function staveIs(h: Harness, tx: number, ty: number, dir: Dir4): void {
  walkFighting(h, tx, ty);
  face(h, dir);
  settle(h);
  if ((h.sim.state.inv.items.stave_is ?? 0) > 0) {
    h.sim.command({ t: 'equip', slot: 1, item: 'stave_is' });
    h.idle(1);
    h.press(['item2']).idle(40);
    h.sim.command({ t: 'equip', slot: 1, item: 'bombs' });
    h.idle(1);
  } else sing(h, tx, ty, dir, 'is');
  alive(h);
}

/**
 * Crosses a lava channel on row `y` from column `from` to `to`, laying Ís crust first (from a stave while
 * any is left, else sung). A crust still there with time on it is walked at once; one about to cool is let
 * cool, then laid again.
 */
function crossLava(h: Harness, from: number, to: number, y: number): void {
  const dir: Dir4 = to > from ? 'e' : 'w';
  walkFighting(h, from, y);
  const step = to > from ? 1 : -1;
  const lava: number[] = [];
  for (let x = from + step; x !== to; x += step) {
    const t = h.sim.terrainOf(h.sim.screen.id).cells[y * 40 + x];
    if (t === 'lava') lava.push(y * 40 + x);
  }
  const left = (): number => Math.min(...lava.map((i) => h.sim.crust?.get(i) ?? 0));
  if (left() < 90) {
    h.until(() => lava.every((i) => (h.sim.crust?.get(i) ?? 0) === 0), 400);
    staveIs(h, from, y, dir);
  }
  walkTo(h, to, y);
}

/** Steps toward a point for one tick (both axes at once), or stands still when there. */
export function stepToward(h: Harness, x: number, y: number, slack = 3): boolean {
  const dx = x - h.sim.hero.pos.x;
  const dy = y - h.sim.hero.pos.y;
  const held: Action[] = [];
  if (dx > slack) held.push('right');
  if (dx < -slack) held.push('left');
  if (dy > slack) held.push('down');
  if (dy < -slack) held.push('up');
  h.step(frameOf(held));
  return held.length === 0;
}

/** Turns to `dir` in place (a tap, no step) once the hero is free. */
export function turn(h: Harness, dir: Dir4): void {
  settle(h);
  if (h.sim.hero.facing !== dir) h.step(frameOf([KEY[dir]], [KEY[dir]]));
}

/** Breaks the plate of every iron warden on the screen with the hammer, then fights them down. */
function smashWardens(h: Harness): void {
  for (let spent = 0; spent < 4000; spent++) {
    const w = h.sim.enemies.find((e) => e.def === 'jarnvordr' && e.mem['cracked'] !== 1);
    if (w === undefined) break;
    if (w.fsm.s === 'rise' || h.sim.hero.fsm.s !== 'move' || h.sim.mode !== 'play') {
      h.idle(1);
      continue;
    }
    const dx = w.pos.x - h.sim.hero.pos.x;
    const dy = h.sim.hero.pos.y - w.pos.y;
    if (w.anim === 'tell' && Math.hypot(dx, dy) < 44) {
      h.step(frameOf([dy >= 0 ? 'down' : 'up']));
      continue;
    }
    if (Math.abs(dx) <= 6 && dy >= 12 && dy <= 24) {
      turn(h, 'n');
      h.press(['item1']).idle(h.sim.db.tuning.hero.hammerTicks);
      alive(h);
      continue;
    }
    stepToward(h, w.pos.x, w.pos.y + 18, 2);
  }
  clearRoom(h);
}

/** Where to stand beside a foe facing `facing`, out of a blow that runs ahead of it, and which way to face. */
function besideOf(e: Entity, d: number): { x: number; y: number; dir: Dir4 } {
  return e.facing === 'e' || e.facing === 'w'
    ? { x: e.pos.x, y: e.pos.y + d, dir: 'n' }
    : { x: e.pos.x + d, y: e.pos.y, dir: 'w' };
}

/**
 * Belgr: keeps out of its fire cone while its bellows swell and it breathes, then sets a bomb by its gaping
 * intake as it draws air; the blast staggers it, and the sword bites until it closes up again.
 */
function belgr(h: Harness): void {
  const log: string[] = [];
  for (let spent = 0; spent < 9000;) {
    const b = boss(h, 'belgr');
    if (b === undefined) return;
    log.push(`${String(h.sim.tick)} ${b.fsm.s} hp ${String(b.hp)} ask ${String(h.sim.hero.hp)}`);
    if (h.sim.mode !== 'play') {
      h.idle(1);
      spent++;
      continue;
    }
    if (b.fsm.s === 'swell' || b.fsm.s === 'breathe') {
      const at = besideOf(b, 26);
      stepToward(h, at.x, at.y);
      spent++;
      continue;
    }
    if (b.fsm.s === 'draw' && b.fsm.t < 12) {
      const at = besideOf(b, 26);
      for (let t = 0; t < 10 && !stepToward(h, at.x, at.y); t++) spent++;
      turn(h, at.dir);
      h.press(['item2']);
      for (let t = 0; t < 24; t++) h.step(frameOf([BACK[at.dir]]));
      h.until(
        () => b.fsm.s !== 'draw' || !h.sim.actors.some((a) => a.kind === 'prop' && a.def === 'bomb'),
        120,
      );
      spent += 140;
      continue;
    }
    if (b.fsm.s === 'reel') {
      // Open: in to sword reach below it, and strike.
      const at = { x: b.pos.x, y: b.pos.y + 20 };
      if (h.sim.hero.fsm.s !== 'move' || !stepToward(h, at.x, at.y, 3)) {
        if (h.sim.hero.fsm.s !== 'move') h.idle(1);
        spent++;
        continue;
      }
      turn(h, 'n');
      h.step(frameOf([], ['sword']));
      spent++;
      continue;
    }
    // Stalking or drawing late: keep a little way off, below it.
    stepToward(h, b.pos.x, b.pos.y + 64);
    spent++;
  }
  throw new Error(`Belgr still stands\n${log.slice(-40).join('\n')}`);
}

/**
 * Ívaldi, the Anvil: (1) sidesteps his slam and breaks a plate with the hammer while his own sticks in the
 * floor; (2) shakes him off his anvil with Skjálfti; (3) cools him with Ís when he glows. While he lies open
 * the sword and hammer bite.
 */
function ivaldi(h: Harness): void {
  const log: string[] = [];
  for (let spent = 0; spent < 20000;) {
    const iv = boss(h, 'ivaldi');
    if (iv === undefined) return;
    if (iv.fsm.t === 0 || spent % 120 === 0)
      log.push(
        `${String(h.sim.tick)} ${iv.fsm.s}/${String(iv.fsm.t)} hp ${String(iv.hp)} ask ${String(h.sim.hero.hp)} ${h.sim.hero.fsm.s} seidr ${String(h.sim.state.hero.seidr)} iv ${String(Math.round(iv.pos.x))},${String(Math.round(iv.pos.y))} ask ${String(Math.round(h.sim.hero.pos.x))},${String(Math.round(h.sim.hero.pos.y))}`,
      );
    if (h.sim.mode === 'over') throw new Error(`Ask fell to Ívaldi\n${log.slice(0, 120).join('\n')}`);
    if (h.sim.mode !== 'play' || h.sim.hero.fsm.s !== 'move') {
      h.idle(1);
      spent++;
      continue;
    }
    const s = iv.fsm.s;
    if (s === 'raise') {
      // Out of the line his hammer will fall along.
      const at = besideOf(iv, 36);
      stepToward(h, at.x, at.y);
      spent++;
      continue;
    }
    if (s === 'stuck' || s === 'cooled') {
      if ((iv.mem['exposed'] ?? 0) === 1) {
        const at = { x: iv.pos.x, y: iv.pos.y + 18 };
        if (!stepToward(h, at.x, at.y, 2)) {
          spent++;
          continue;
        }
        turn(h, 'n');
        h.press(['item1']).idle(h.sim.db.tuning.hero.hammerTicks + 2);
        spent += 30;
        continue;
      }
    }
    if (s === 'open' || s === 'thrown') {
      const at = { x: iv.pos.x, y: iv.pos.y + 20 };
      if (!stepToward(h, at.x, at.y, 3)) {
        spent++;
        continue;
      }
      turn(h, 'n');
      h.step(frameOf([], ['sword']));
      spent++;
      continue;
    }
    if (s === 'anvil' || s === 'lift' || s === 'quake' || s === 'climb') {
      // Out of the ring of his shockwaves; once he sits his anvil, Skjálfti.
      const at = { x: iv.pos.x, y: iv.pos.y + 72 };
      if (!stepToward(h, at.x, at.y, 4)) {
        spent++;
        continue;
      }
      if (s === 'anvil' && iv.fsm.t > 4) {
        // The stave from the lava stair first (it costs no seiðr), then the song.
        if ((h.sim.state.inv.items.stave_skjalfti ?? 0) > 0) {
          h.sim.command({ t: 'equip', slot: 1, item: 'stave_skjalfti' });
          h.idle(1);
          h.press(['item2']);
        } else {
          h.sim.command({ t: 'ready', galdr: 'skjalfti' });
          h.idle(1);
          h.press(['galdr']);
        }
        spent += 2;
        continue;
      }
      h.idle(1);
      spent++;
      continue;
    }
    if ((iv.mem['hot'] ?? 0) === 1 && (s === 'stalk' || s === 'stuck')) {
      // White-hot: line up below him and sing Ís up at him.
      const at = { x: iv.pos.x, y: iv.pos.y + 60 };
      if (Math.abs(h.sim.hero.pos.x - at.x) > 4 || Math.abs(h.sim.hero.pos.y - at.y) > 20) {
        stepToward(h, at.x, at.y, 4);
        spent++;
        continue;
      }
      turn(h, 'n');
      h.sim.command({ t: 'ready', galdr: 'is' });
      h.idle(1);
      h.press(['galdr']).idle(10);
      spent += 12;
      continue;
    }
    // Stalking (or roaring): wait for him a little way off, below, square on.
    stepToward(h, iv.pos.x, iv.pos.y + 40, 4);
    spent++;
  }
  throw new Error(`Ívaldi still stands\n${log.slice(-60).join('\n')}`);
}

/**
 * M8b: from the chasm (the M8a save, a spring morning): a prayer at the Refuge, then by Dvergagröf's stone
 * to the forge gate and into Ívaldi's Forge: the map, the first key in the belt hall, the compass over the
 * lava (Ís), the second key in the slag hall; lock A to the hot hub; the belt lever, and the bars lift to
 * Belgr's hall; Belgr staggered by bombs; the hammer, tried on a stake and a weak floor; the stake east; the
 * wardens' plate broken; the third key, and the belt run's piece of heart; lock B; Skjálfti's stave over the
 * lava; Þorkell and Rannveig in their cells; lock C and the great key; the great door and Ívaldi; Kolbeinn,
 * and the rune-stone out. Then the scree's stakes and their piece of heart, and home to Askdalr, where
 * Þorkell builds the goat-house for ten ore.
 */
export function playM8b(from: GameState): Harness {
  const h = new Harness({ state: from });
  h.idle(2);

  // A prayer at the Refuge's hof for health and seiðr, then back to the dwarves and the forge gate.
  warpTo(h, 'saevatn', 'sae_holmr');
  intoHall(h);
  pray(h);
  outOfHall(h);
  warpTo(h, 'dvergagrof', 'dvg_chasm');
  travel(h, 'dvg_forgegate');
  through(h, 19, 7, 'n', 'd6_r25');
  walkTo(h, 19, 16);
  h.until((s) => s.mode === 'story', 120, frameOf(['up']));
  finishStory(h);
  expect(h.sim.state.flags.st_d6_entered).toBe(true);

  // West: the map, the first key in the belt hall, and the compass over the lava.
  leave(h, 2, 10, 'w', 'd6_r24');
  useAt(h, 20, 5, 'n');
  expect(d6(h).map).toBe(true);
  leave(h, 2, 10, 'w', 'd6_r23');
  clearRoom(h);
  useAt(h, 20, 17, 'n');
  expect(d6(h).keys).toBe(1);
  leave(h, 2, 10, 'w', 'd6_r22');
  crossLava(h, 22, 17, 10);
  useAt(h, 8, 11, 'n');
  expect(d6(h).compass).toBe(true);
  crossLava(h, 17, 22, 10);

  // East to the slag hall's key (the belt hall's shutters drop again until its foes are down).
  leave(h, 37, 10, 'e', 'd6_r23');
  clearRoom(h);
  leave(h, 37, 10, 'e', 'd6_r24');
  leave(h, 37, 10, 'e', 'd6_r25');
  leave(h, 37, 10, 'e', 'd6_r26');
  clearRoom(h);
  useAt(h, 20, 12, 'n');
  expect(d6(h).keys).toBe(2);

  // Lock A to the hub; the belt lever; Belgr.
  leave(h, 2, 10, 'w', 'd6_r25');
  unlock(h, 19, 2, 'n', 'd6_r18');
  leave(h, 2, 10, 'w', 'd6_r17');
  walkFighting(h, 11, 10);
  face(h, 'w');
  h.press(['sword']).idle(30);
  expect(h.sim.state.flags.w_d6_belts).toBe(true);
  leave(h, 3, 10, 'w', 'd6_r16');
  belgr(h);
  expect(h.sim.state.flags.st_d6_belgr).toBe(true);
  for (let i = 0; i < 300 && h.sim.mode !== 'play'; i++) h.idle(1);

  // The hammer, and a stake and a weak floor to try it on.
  leave(h, 2, 10, 'w', 'd6_r15');
  useAt(h, 20, 10, 'n');
  expect(h.sim.state.inv.items.hammer).toBe(1);
  useAt(h, 12, 4, 'n');
  expect(h.sim.hero.hp).toBe(h.sim.hero.maxHp);
  h.sim.command({ t: 'equip', slot: 0, item: 'hammer' });
  h.idle(1);
  hammerAt(h, 30, 8, 'n');
  useAt(h, 31, 5, 'n');
  hammerAt(h, 7, 13, 's');
  useAt(h, 7, 18, 'n');
  expect(h.sim.state.world.opened).toEqual(expect.arrayContaining(['d6_k_r15n', 'd6_k_r15s']));

  // Back to the hub; the stake east; the wardens; the third key and the belt run.
  leave(h, 37, 10, 'e', 'd6_r16');
  leave(h, 37, 10, 'e', 'd6_r17');
  leave(h, 37, 10, 'e', 'd6_r18');
  hammerAt(h, 38, 10, 'e');
  leave(h, 38, 10, 'e', 'd6_r19');
  smashWardens(h);
  leave(h, 37, 10, 'e', 'd6_r20');
  clearRoom(h);
  useAt(h, 20, 11, 'n');
  expect(d6(h).keys).toBe(2);
  hammerAt(h, 31, 10, 'e');
  leave(h, 37, 10, 'e', 'd6_r21');
  walkTo(h, 34, 10, 1200);
  expect(h.sim.state.world.pieces).toContain('hp_d6_r21');
  leave(h, 2, 10, 'w', 'd6_r20');
  clearRoom(h);
  leave(h, 2, 10, 'w', 'd6_r19');
  leave(h, 2, 10, 'w', 'd6_r18');

  // Lock B; Skjálfti's stave over the lava; the cells.
  unlock(h, 19, 2, 'n', 'd6_r11');
  leave(h, 2, 10, 'w', 'd6_r10');
  crossLava(h, 20, 15, 10);
  useAt(h, 8, 11, 'n');
  expect(h.sim.state.inv.galdr).toContain('skjalfti');
  leave(h, 2, 10, 'w', 'd6_r09');
  useAt(h, 23, 10, 'e');
  leave(h, 2, 10, 'w', 'd6_r08');
  useAt(h, 23, 10, 'e');
  leave(h, 37, 10, 'e', 'd6_r09');
  leave(h, 37, 10, 'e', 'd6_r10');
  crossLava(h, 15, 20, 10);

  // Lock C and the great key on its dais.
  unlock(h, 20, 2, 'n', 'd6_r03');
  hammerAt(h, 19, 16, 'n');
  useAt(h, 20, 11, 'n');
  expect(d6(h).bigKey).toBe(true);

  // West over the bridge forge to the old smithy's ore, and back.
  leave(h, 2, 10, 'w', 'd6_r02');
  leave(h, 2, 10, 'w', 'd6_r01');
  useAt(h, 6, 11, 'n');
  leave(h, 37, 10, 'e', 'd6_r02');
  leave(h, 37, 10, 'e', 'd6_r03');
  leave(h, 19, 19, 's', 'd6_r10');
  leave(h, 37, 10, 'e', 'd6_r11');

  // East through the furnaces and the long belts to the store room's hidden ore, and back.
  leave(h, 37, 10, 'e', 'd6_r12');
  smashWardens(h);
  leave(h, 37, 10, 'e', 'd6_r13');
  leave(h, 37, 10, 'e', 'd6_r14');
  hammerAt(h, 31, 10, 'n');
  useAt(h, 32, 5, 'n');
  expect(h.sim.state.world.opened).toContain('d6_c_cache');
  leave(h, 2, 10, 'w', 'd6_r13');
  leave(h, 2, 10, 'w', 'd6_r12');
  leave(h, 2, 10, 'w', 'd6_r11');

  // A drink at the forecourt's trough, the great door, and Ívaldi.
  useAt(h, 27, 3, 'n');
  unlock(h, 19, 2, 'n', 'd6_r04');
  walkTo(h, 19, 15);
  ivaldi(h);
  expect(h.sim.state.flags.st_thane_ivaldi).toBe(true);
  for (let i = 0; i < 600 && h.sim.mode !== 'play'; i++) {
    if (h.sim.mode === 'story') finishStory(h);
    else h.idle(1);
  }
  if (h.sim.mode !== 'play') throw new Error(`after Ívaldi: ${h.sim.mode}`);
  fightNear(h);
  walkTo(h, 20, 12);
  h.idle(4);
  if (h.sim.storyUi() !== null) finishStory(h);
  expect(h.sim.state.world.opened).toContain('d6_hc');
  walkTo(h, 20, 7);
  h.until((s) => s.mode === 'story', 120, frameOf(['up']));
  finishStory(h);
  expect(h.sim.state.flags.st_d6_kolbeinn).toBe(true);
  useAt(h, 20, 4, 'n');
  h.until((s) => s.screen.id === 'dvg_forgegate' && s.mode === 'play', 300);

  // The scree's stakes, and the piece of heart behind them.
  travel(h, 'dvg_scree');
  hammerAt(h, 5, 8, 'n');
  walkTo(h, 5, 4);
  expect(h.sim.state.world.pieces).toContain('hp_dvg_scree');

  // Home by the cart road to Uppvík and down the road, to Þorkell, in daylight: the goat-house for ten ore.
  travel(h, 'dvg_minehead');
  through(h, 31, 5, 'n', 'dvg_int_tunnel');
  through(h, 37, 9, 'n', 'upp_int_smithy');
  through(h, 19, 15, 's', 'upp_smiths');
  travel(h, 'ask_village');
  h.until((s) => !isNight(s.state.clock, s.db.clock), 40 * 3600);
  h.idle(30);
  talkTo(h, 'thorkell');
  expect(h.sim.state.flags.q_farm).toBe(3);
  return h;
}
