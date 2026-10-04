import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import type { ScreenId } from '@content/world/screens';
import type { Dir4 } from '@core/math/dir';
import { questLog } from '@core/story/quests';
import { tileFeet } from '@core/world/screen';
import { Harness, frameOf } from './harness';
import { crossTo, face, finishStory, interactNorth, walkTo } from './walk';

function warp(h: Harness, screen: ScreenId, x: number, y: number): Harness {
  const p = tileFeet({ x, y });
  h.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
  return h.idle(2);
}

const quest = (h: Harness) =>
  questLog(DB.quests, { state: h.sim.state, quests: DB.quests }).find((q) => q.id === 'q_crates');
const crates = (h: Harness) => h.sim.actors.filter((a) => a.kind === 'prop' && a.def.startsWith('crate'));

/** Lifts the crate at (tx, ty), carries it out over the `dir` edge at `exit` into the village, and sets it down at Sigrún's door. */
function carryHome(
  h: Harness,
  screen: ScreenId,
  crate: [number, number],
  exit: [number, number],
  dir: Dir4,
): void {
  warp(h, screen, crate[0], crate[1] + 2);
  interactNorth(h, crate[0], crate[1]);
  h.idle(16);
  expect(h.sim.hero.fsm.s).toBe('carry');
  walkTo(h, exit[0], exit[1]);
  crossTo(h, dir, 'ask_village');
  expect(h.sim.hero.fsm.s).toBe('carry');
  expect(crates(h)).toHaveLength(1);
  walkTo(h, 8, 7);
  face(h, 'n');
  h.step(frameOf([], ['interact'])).idle(20);
}

describe('Sigrún’s crates (q_crates)', () => {
  it('carries three crates the storm scattered back to her door: a piece of heart, and cheese for sale', () => {
    const h = new Harness({ preset: DEV_PRESETS.fimbul });
    h.sim.state.flags.st_home_winter = true;
    warp(h, 'ask_int_trader', 19, 14);
    interactNorth(h, 19, 11);
    finishStory(h);
    expect(h.sim.state.flags.q_crates_asked).toBe(true);

    carryHome(h, 'ask_farmyard', [37, 17], [38, 10], 'e');
    expect(h.sim.state.flags.q_crates_home).toBe(1);
    expect(crates(h)).toHaveLength(0);
    carryHome(h, 'ask_hof', [34, 9], [1, 10], 'w');
    carryHome(h, 'ask_brook', [8, 6], [19, 1], 'n');
    expect(h.sim.state.flags.q_crates_home).toBe(3);
    // Delivered crates stay delivered.
    warp(h, 'ask_farmyard', 36, 17);
    expect(crates(h)).toHaveLength(0);

    warp(h, 'ask_int_trader', 19, 14);
    interactNorth(h, 19, 11);
    finishStory(h);
    expect(h.sim.state.world.pieces).toContain('hp_ask_village');
    expect(h.sim.state.flags.q_crates_done).toBe(true);
    expect(quest(h)?.done).toBe(true);
    expect(DB.shops.sigrun?.stock.some((r) => 'item' in r && r.item === 'cheese')).toBe(true);
  });
});
