import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import { Harness, frameOf } from './harness';
import { crossFighting, crossTo, finishStory, talkTo, walkFighting, walkTo } from './walk';

/** Every leg ends with the hero standing, every entity drawable. */
function alive(h: Harness): void {
  expect(h.sim.mode, `fell on ${h.sim.screen.id}`).not.toBe('over');
  h.expectAnims();
}

/** From the third evening: sleep, escape the raid, the morning, the legend, then Myrkviðr to the roots. */
export function playRaidToRoots(seed: number): Harness {
  const h = new Harness({ preset: DEV_PRESETS.night3, seed });
  h.hold(['up'], 2).press(['interact']);
  finishStory(h);
  expect(h.sim.state.flags.st_raid_begun).toBe(true);

  // The burning longhouse, the yard, the gate.
  walkFighting(h, 19, 19);
  crossTo(h, 's', 'ask_farmyard');
  alive(h);
  walkFighting(h, 19, 1);
  crossFighting(h, 'n', 'ask_gate');
  alive(h);
  h.until((s) => s.mode === 'story', 600, frameOf(['up']));
  finishStory(h);
  expect(h.sim.state.flags.st_raid_done).toBe(true);

  // The morning: Halvar's seax and shield, then Gyða's legend in the hof.
  talkTo(h, 'halvar');
  expect(h.sim.state.inv.weapon).toBe('seax');
  walkTo(h, 19, 19);
  crossTo(h, 's', 'ask_farmyard');
  walkTo(h, 38, 10);
  crossTo(h, 'e', 'ask_village');
  walkTo(h, 38, 10);
  crossTo(h, 'e', 'ask_hof');
  walkTo(h, 20, 8);
  crossTo(h, 'n', 'ask_int_hof');
  talkTo(h, 'gyda');
  expect(h.sim.state.flags.st_legend_told).toBe(true);
  walkTo(h, 20, 17);
  crossTo(h, 's', 'ask_hof');
  walkTo(h, 1, 10);
  crossTo(h, 'w', 'ask_village');
  walkTo(h, 1, 10);
  crossTo(h, 'w', 'ask_farmyard');
  walkTo(h, 19, 1);
  crossTo(h, 'n', 'ask_gate');
  walkTo(h, 19, 1);
  crossTo(h, 'n', 'myr_road_s');
  alive(h);

  // Myrkviðr, fighting the vargar on the way.
  walkFighting(h, 19, 1);
  crossFighting(h, 'n', 'myr_road');
  alive(h);
  walkFighting(h, 38, 9);
  crossFighting(h, 'e', 'myr_pines');
  alive(h);
  walkFighting(h, 26, 1);
  crossFighting(h, 'n', 'myr_roots');
  alive(h);
  talkTo(h, 'arnbjorg');
  expect(h.sim.state.flags.n_arnbjorg_met).toBe(true);
  return h;
}

describe('M1b route', () => {
  it('escapes the raid, hears the legend and walks Myrkviðr to the root cave', () => {
    const h = playRaidToRoots(5);
    expect(h.sim.screen.id).toBe('myr_roots');
    expect(h.sim.state.clock.policy).toBe('cycling');
    expect(h.sim.state.world.visited).toEqual(
      expect.arrayContaining(['myr_road_s', 'myr_road', 'myr_pines', 'myr_roots']),
    );
    console.log(
      `M1b route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play)`,
    );
  }, 120_000);

  it('replays identically', () => {
    expect(playRaidToRoots(9).sim.hash()).toBe(playRaidToRoots(9).sim.hash());
  }, 240_000);
});
