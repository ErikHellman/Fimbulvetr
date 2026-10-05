import { expect } from 'vitest';
import type { RegionId } from '@content/ids';
import type { GameState } from '@core/state/gameState';
import type { Dir4 } from '@core/math/dir';
import type { ScreenId } from '@content/world/screens';
import { follower } from '@core/sim/systems/escort';
import { length, sub } from '@core/math/vec';
import { Harness, frameOf } from '../harness';
import { buyInShop, crossTo, face, finishStory, talkTo, walkFighting, walkTo } from '../walk';
import { alive, leave, outOfHall, travel, useAt } from './m7b';

/** Stands on (tx, ty) facing `dir` and fires the grapple (slot 1) at a post, riding the pull to its end. */
export function pull(h: Harness, tx: number, ty: number, dir: Dir4): void {
  walkFighting(h, tx, ty);
  face(h, dir);
  h.press(['item1']);
  h.until((s) => s.hero.fsm.s === 'move' && s.mode === 'play', 240);
  h.idle(2);
  alive(h);
}

/** Stands on (tx, ty) facing `dir`, sets a bomb (slot 2) and backs off the other way until it blows. */
export function bomb(h: Harness, tx: number, ty: number, dir: Dir4): void {
  const back = ({ n: 'down', s: 'up', e: 'left', w: 'right' } as const)[dir];
  walkFighting(h, tx, ty);
  face(h, dir);
  h.press(['item2']);
  h.hold([back], 22);
  h.until((s) => !s.actors.some((a) => a.kind === 'prop' && a.def === 'bomb'), 200);
  h.idle(10);
  alive(h);
}

/** Sings Farvegr and picks `region`'s stone. */
export function warpTo(h: Harness, region: RegionId, to: ScreenId): void {
  h.sim.command({ t: 'ready', galdr: 'farvegr' });
  h.idle(1);
  h.press(['galdr']);
  const ui = h.sim.storyUi();
  if (ui?.k !== 'warps') throw new Error(`no warp picker on ${h.sim.screen.id}`);
  for (let i = 0; i < ui.rows.indexOf(region); i++) h.press(['down']);
  h.press(['confirm']);
  h.until((s) => s.mode === 'play' && s.screen.id === to, 400);
  alive(h);
}

/** Walks through a door (standing on (tx, ty), pressing `dir`) to `to`, reading any story there. */
export function through(h: Harness, tx: number, ty: number, dir: Dir4, to: ScreenId): void {
  walkFighting(h, tx, ty);
  crossTo(h, dir, to, 900);
  if (h.sim.mode === 'story') finishStory(h);
  alive(h);
}

/** How far behind Ask the escorted NPC is, in px. */
function gap(h: Harness): number {
  const her = follower(h.sim);
  if (her === undefined) throw new Error(`no one follows Ask on ${h.sim.screen.id}`);
  return length(sub(h.sim.hero.pos, her.pos));
}

/** Leads the escort through the tiles in turn, waiting at each for her to catch up. */
function lead(h: Harness, ...tiles: (readonly [number, number])[]): void {
  for (const [x, y] of tiles) {
    walkFighting(h, x, y);
    for (let t = 0; t < 600 && gap(h) > 32; t++) h.idle(1);
    alive(h);
  }
}

/**
 * M8a: from the Refuge's hall (the M7b save, a spring night): Farvegr to Haugar and over the tarn's moor to
 * the chasm, crossed by the grapple; the warp stone; Dvalinn at the camp; the cave-in blown; Hekla led
 * through the old workings to the lamp-room; the cart road opened; Sindri's byrnie for ore and the needle
 * for his lens; the cart road walked to Uppvík and back. Then Embla's second letter at the Refuge, and the
 * cairn on Haugar's tarn.
 */
export function playM8a(from: GameState): Harness {
  const h = new Harness({ state: from });
  h.idle(2);

  // Out of the hall, Farvegr to the stone circle, and east over the moor to the chasm.
  outOfHall(h);
  warpTo(h, 'haugar', 'hau_circle');
  travel(h, 'hau_tarn');
  leave(h, 39, 10, 'e', 'dvg_chasm');
  pull(h, 4, 10, 'e');
  walkTo(h, 10, 10);
  h.until((s) => s.mode === 'story', 120, frameOf(['right']));
  finishStory(h);
  expect(h.sim.state.flags.st_dvg_reached).toBe(true);
  useAt(h, 26, 7, 'n');
  expect(h.sim.state.world.warps).toContain('dvergagrof');

  // The foreman at his camp; the cave-in at the mine mouth; the way in.
  travel(h, 'dvg_camp');
  talkTo(h, 'dvalinn');
  expect(h.sim.state.flags.q_foreman).toBe(1);
  travel(h, 'dvg_minehead');
  bomb(h, 20, 6, 'n');
  expect(h.sim.state.world.opened).toContain('dvg_k_cavein');
  through(h, 20, 5, 'n', 'dvg_int_mine1');
  walkTo(h, 16, 19);
  h.until((s) => s.mode === 'story', 120, frameOf(['left']));
  finishStory(h);
  expect(h.sim.state.flags.q_foreman).toBe(2);
  through(h, 20, 19, 's', 'dvg_minehead');
  travel(h, 'dvg_camp');
  talkTo(h, 'dvalinn');
  expect(h.sim.state.flags.q_foreman).toBe(3);

  // Hekla at the mine mouth, and down through the old workings to the lamp-room.
  travel(h, 'dvg_minehead');
  talkTo(h, 'hekla');
  expect(h.sim.escortHp()).not.toBeNull();
  lead(h, [20, 5]);
  through(h, 20, 5, 'n', 'dvg_int_mine1');
  lead(h, [5, 18], [5, 11], [35, 11], [35, 4], [6, 2]);
  through(h, 6, 2, 'n', 'dvg_int_mine2');
  lead(h, [18, 18], [18, 12], [25, 12], [25, 6], [19, 6]);
  h.until((s) => s.mode === 'story', 120, frameOf(['left']));
  finishStory(h);
  expect(h.sim.state.flags.q_foreman).toBe(4);
  expect(h.sim.escortHp()).toBeNull();

  // Out again, and Dvalinn opens the cart road.
  through(h, 34, 19, 's', 'dvg_int_mine1');
  through(h, 20, 19, 's', 'dvg_minehead');
  travel(h, 'dvg_camp');
  talkTo(h, 'dvalinn');
  expect(h.sim.state.flags.q_foreman).toBe(5);

  // Sindri's forge: the needle for his lens, and the ember byrnie for twelve ore.
  through(h, 29, 6, 'n', 'dvg_int_forge');
  walkFighting(h, 22, 10);
  face(h, 'n');
  h.step(frameOf([], ['interact']));
  buyInShop(h, 0);
  expect(h.sim.state.flags.q_trade).toBe(6);
  expect(h.sim.state.inv.items.trade_lens).toBe(1);
  expect(h.sim.state.inv.armor).toBe('ember_byrnie');
  through(h, 19, 15, 's', 'dvg_camp');

  // The cart road to Uppvík's smiths, and back.
  travel(h, 'dvg_minehead');
  through(h, 31, 5, 'n', 'dvg_int_tunnel');
  through(h, 37, 9, 'n', 'upp_int_smithy');
  through(h, 24, 7, 'n', 'dvg_int_tunnel');
  through(h, 2, 9, 'n', 'dvg_minehead');

  // Embla's second letter at the Refuge, and the cairn on Haugar's tarn.
  warpTo(h, 'saevatn', 'sae_holmr');
  walkTo(h, 18, 12);
  h.until((s) => s.screen.id === 'ref_int_hall' && s.mode === 'play', 120, frameOf(['up']));
  h.idle(30);
  talkTo(h, 'embla');
  expect(h.sim.state.flags.q_letters).toBe(2);
  outOfHall(h);
  warpTo(h, 'haugar', 'hau_circle');
  travel(h, 'hau_tarn');
  useAt(h, 4, 18, 'n');
  expect(h.sim.state.flags.st_letter2_found).toBe(true);
  expect(h.sim.state.world.pieces).toContain('hp_hau_tarn_letter');

  // Back to the dwarf country by its stone, ready for Ívaldi's Forge.
  warpTo(h, 'dvergagrof', 'dvg_chasm');
  return h;
}
