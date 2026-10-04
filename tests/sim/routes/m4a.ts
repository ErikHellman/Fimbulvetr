import type { GameState } from '@core/state/gameState';
import { expect } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import type { ScreenId } from '@content/world/screens';
import type { Dir4 } from '@core/math/dir';
import { Harness, frameOf } from '../harness';
import {
  crossFighting,
  crossTo,
  duel,
  face,
  finishStory,
  interactNorth,
  talkTo,
  walkFighting,
  walkTo,
} from '../walk';

function alive(h: Harness): void {
  expect(h.sim.mode, `fell on ${h.sim.screen.id}`).not.toBe('over');
  h.expectAnims();
}

/** Drinks the red mead from the menu's action when health runs low (the walker cannot open menus). */
function drinkIfLow(h: Harness): void {
  if (h.sim.hero.hp <= 6 && (h.sim.state.inv.items.mead_red ?? 0) > 0) {
    h.sim.command({ t: 'eat', item: 'mead_red' });
    h.idle(1);
  }
}

function leave(h: Harness, tx: number, ty: number, dir: Dir4, to: ScreenId): void {
  drinkIfLow(h);
  walkFighting(h, tx, ty);
  crossFighting(h, dir, to);
  if (h.sim.mode === 'story') finishStory(h);
  alive(h);
}

/**
 * From the birch glade after M3 into Haugar: the rockfall, the warp stone at the circle, Styrr's two
 * lessons and his wait for nightfall, then the barrow-watch at the King's Barrow.
 */
export function playM4a(seed: number, from?: GameState): Harness {
  const h = new Harness(from === undefined ? { preset: DEV_PRESETS.hau, seed } : { state: from });
  h.idle(2);

  // East out of the glade to the rockfall: a bomb, stand clear, and on into Haugar.
  leave(h, 39, 17, 'e', 'hau_gully');
  walkTo(h, 5, 17);
  face(h, 'e');
  h.press(['item1']);
  walkTo(h, 1, 17);
  h.idle(110);
  expect(h.sim.state.world.opened).toContain('hau_k_gully');
  walkTo(h, 7, 17);
  h.until(() => h.sim.mode === 'story', 90, frameOf(['right']));
  finishStory(h);
  expect(h.sim.state.flags.st_haugar_reached).toBe(true);

  // North through the barrow field and over the heath to the stone circle; wake its warp stone.
  leave(h, 19, 0, 'n', 'hau_barrows');
  leave(h, 9, 0, 'n', 'hau_heath');
  leave(h, 39, 11, 'e', 'hau_circle');
  interactNorth(h, 20, 8);
  finishStory(h);
  expect(h.sim.state.world.warps).toContain('haugar');

  // East to Styrr's cottage: the barrow-watch, the dash thrust, then the parry, then the wait for dark.
  leave(h, 39, 11, 'e', 'hau_huscarl');
  walkTo(h, 24, 8);
  crossTo(h, 'n', 'hau_int_styrr');
  talkTo(h, 'styrr');
  expect(h.sim.state.flags.q_rs3_watch).toBe(true);
  expect(h.sim.state.flags.t_dash).toBe(true);
  talkTo(h, 'styrr');
  expect(h.sim.state.flags.t_parry).toBe(true);
  talkTo(h, 'styrr');
  expect(h.sim.state.clock.minute).toBeGreaterThanOrEqual(22 * 60);
  walkTo(h, 19, 14);
  crossTo(h, 's', 'hau_huscarl');

  // Back through the circle to the King's Barrow, where three wights rise to meet the watch.
  leave(h, 0, 11, 'w', 'hau_circle');
  leave(h, 19, 21, 's', 'hau_king');
  walkTo(h, 20, 14);
  for (let round = 0; round < 12 && h.sim.state.flags.st_barrow_open !== true; round++) {
    drinkIfLow(h);
    const wights = h.sim.enemies.filter((e) => e.def === 'haugbui');
    const nearest = wights.sort(
      (a, b) =>
        Math.hypot(a.pos.x - h.sim.hero.pos.x, a.pos.y - h.sim.hero.pos.y) -
        Math.hypot(b.pos.x - h.sim.hero.pos.x, b.pos.y - h.sim.hero.pos.y),
    )[0];
    if (nearest === undefined) h.idle(10);
    else duel(h, nearest);
    if (h.sim.mode === 'story') finishStory(h);
    alive(h);
  }
  expect(h.sim.state.flags.q_watch_kills).toBe(3);
  expect(h.sim.state.flags.st_barrow_open).toBe(true);
  alive(h);
  return h;
}
