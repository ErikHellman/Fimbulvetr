import type { GameState } from '@core/state/gameState';
import { expect } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import type { ScreenId } from '@content/world/screens';
import type { Dir4 } from '@core/math/dir';
import { Harness, frameOf } from '../harness';
import {
  crossFighting,
  crossTo,
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

/** Fishes from where Ask stands until one fish is landed: strike every bite, keep the line in its band. */
function fishUntilLanded(h: Harness): string {
  for (let i = 0; i < 20_000; i++) {
    const ui = h.sim.storyUi();
    if (ui?.k !== 'fish') throw new Error('not fishing');
    if (ui.phase === 'result' && ui.result === 'landed' && ui.fish !== null) {
      const fish = ui.fish;
      h.press(['cancel']);
      h.idle(2);
      return fish;
    }
    if (ui.phase === 'idle' || ui.phase === 'bite' || ui.phase === 'result') h.press(['confirm']);
    else if (ui.phase === 'reel' && ui.tension < 700 && !ui.surging) h.hold(['confirm'], 1);
    else h.idle(1);
  }
  throw new Error('nothing landed');
}

/** From the forest brook's bank path after M2 into Mýrland: the latch, the mill's tale, Kári's rod, a catch. */
export function playM3a(seed: number, from?: GameState): Harness {
  const h = new Harness(from === undefined ? { preset: DEV_PRESETS.myl, seed } : { state: from });
  h.idle(2);

  // Down the bank path to the weir, and the boomerang across the rapids at the latch.
  leave(h, 35, 21, 's', 'myl_weir');
  walkTo(h, 28, 4);
  face(h, 'w');
  h.press(['item1']);
  h.until(() => h.sim.state.flags.w_myl_bridge === true, 90);
  expect(h.sim.state.flags.w_myl_bridge).toBe(true);
  h.idle(40);

  // Over the bridge: Mýrland.
  walkTo(h, 22, 8);
  h.until(() => h.sim.mode === 'story', 90, frameOf(['left']));
  finishStory(h);
  expect(h.sim.state.flags.st_myrland_reached).toBe(true);

  // West along the north bank, past the ford and the old bridge, to the millpond.
  leave(h, 0, 8, 'w', 'myl_ford');
  leave(h, 0, 8, 'w', 'myl_river');
  leave(h, 0, 8, 'w', 'myl_mill');

  // Þuríðr, in her house on the north bank: the drowned mill and the stone in its cellar.
  walkFighting(h, 31, 6);
  crossTo(h, 'n', 'myl_int_widow');
  talkTo(h, 'thuridr');
  expect(h.sim.state.flags.q_rs2_mill).toBe(true);
  walkTo(h, 19, 14);
  crossTo(h, 's', 'myl_mill');
  alive(h);

  // North along the lake shore to Kári, who lends his rod; then a fish from the end of his jetty.
  leave(h, 7, 0, 'n', 'myl_fisher');
  talkTo(h, 'kari');
  expect(h.sim.state.flags.n_kari_met).toBe(true);
  const silver = h.sim.state.hero.silver;
  interactNorth(h, 20, 2).idle(1);
  const fish = fishUntilLanded(h);
  expect(h.sim.state.flags.q_fish_caught).toBe(1);
  expect(h.sim.state.hero.silver).toBeGreaterThan(silver);
  expect(fish).not.toBe('');
  alive(h);
  return h;
}
