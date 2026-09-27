import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import type { ScreenId } from '@content/world/screens';
import type { Dir4 } from '@core/math/dir';
import { Harness } from './harness';
import {
  crossFighting,
  face,
  fightNear,
  finishStory,
  interactNorth,
  talkTo,
  walkFighting,
  walkTo,
} from './walk';

function alive(h: Harness): void {
  expect(h.sim.mode, `fell on ${h.sim.screen.id}`).not.toBe('over');
  h.expectAnims();
}

function leave(h: Harness, tx: number, ty: number, dir: Dir4, to: ScreenId): void {
  walkFighting(h, tx, ty);
  crossFighting(h, dir, to);
  if (h.sim.mode === 'story') finishStory(h);
  alive(h);
}

/** Drinks the red mead from the menu's action when health runs low (the walker cannot open menus). */
function drinkIfLow(h: Harness): void {
  if (h.sim.hero.hp <= 6 && (h.sim.state.inv.items.mead_red ?? 0) > 0) {
    h.sim.command({ t: 'eat', item: 'mead_red' });
    h.idle(1);
  }
}

/** Hunts down the pack leader in the east clearing of the north road, taking on its pack as it comes. */
function huntTheLeader(h: Harness): void {
  const leader = () => h.sim.enemies.find((e) => e.def === 'vargr_alpha');
  for (let round = 0; round < 60 && leader() !== undefined; round++) {
    alive(h);
    drinkIfLow(h);
    const a = leader();
    if (a === undefined) break;
    const tx = Math.floor(a.pos.x / 16);
    const ty = Math.floor((a.pos.y - 1) / 16);
    try {
      walkFighting(h, tx, ty + 1, 240);
    } catch {
      // It moved; fight whatever is close and look again.
    }
    fightNear(h, 72, 240);
  }
  expect(leader(), 'the pack leader still stands').toBeUndefined();
  for (let i = 0; i < 20 && h.sim.enemies.length > 0; i++) {
    drinkIfLow(h);
    fightNear(h, 120, 240);
  }
}

/** From Uppvík's square after M2b to the bounty paid: the notice, Dagný's hint, the leader, Bersi. */
export function playM2c(seed: number): Harness {
  const h = new Harness({ preset: DEV_PRESETS.hunt, seed });

  // The hunters' notice on the Þing-stone.
  interactNorth(h, 26, 12);
  finishStory(h);
  expect(h.sim.state.flags.q_vargar_taken).toBe(true);

  // Out of town and down the road to Dagný, who knows the vargar.
  leave(h, 19, 20, 's', 'upp_gate');
  leave(h, 19, 20, 's', 'myr_north');
  leave(h, 19, 20, 's', 'myr_deep');
  leave(h, 19, 20, 's', 'myr_road');
  talkTo(h, 'dagny');
  expect(h.sim.state.flags.q_vargar_tracked).toBe(true);

  // Back north to the east clearing, where the leader and its pack wait.
  leave(h, 19, 1, 'n', 'myr_deep');
  leave(h, 19, 1, 'n', 'myr_north');
  huntTheLeader(h);
  expect(h.sim.state.flags.q_vargar_alpha).toBe(true);
  alive(h);

  // Bersi pays at the gate; he stands against the palisade, so step up from the west.
  leave(h, 19, 1, 'n', 'upp_gate');
  walkTo(h, 23, 11);
  face(h, 'e');
  h.press(['interact']);
  finishStory(h);
  expect(h.sim.state.flags.q_vargar_done).toBe(true);
  expect(h.sim.state.hero.purse).toBe(1);
  alive(h);
  return h;
}

describe('M2c route', () => {
  it('takes the hunt, kills the pack leader and collects the bounty', () => {
    const h = playM2c(5);
    const c = h.sim.state.clock;
    console.log(
      `M2c route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play), day ${String(c.day)} ${String(Math.floor(c.minute / 60))}:${String(c.minute % 60).padStart(2, '0')}, hp ${String(h.sim.hero.hp)}/${String(h.sim.hero.maxHp)}, silver ${String(h.sim.state.hero.silver)}`,
    );
  }, 120_000);

  it('replays identically', () => {
    expect(playM2c(9).sim.hash()).toBe(playM2c(9).sim.hash());
  }, 240_000);
});
