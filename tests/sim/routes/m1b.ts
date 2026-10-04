import type { GameState } from '@core/state/gameState';
import { expect } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import { Harness, frameOf } from '../harness';
import { crossFighting, crossTo, finishStory, talkTo, walkFighting, walkTo } from '../walk';

/** Every leg ends with the hero standing, every entity drawable. */
function alive(h: Harness): void {
  expect(h.sim.mode, `fell on ${h.sim.screen.id}`).not.toBe('over');
  h.expectAnims();
}

/** From the third evening: sleep, escape the raid, the morning, the legend, then Myrkviðr to the roots. */
export function playRaidToRoots(seed: number, from?: GameState): Harness {
  const h = new Harness(from === undefined ? { preset: DEV_PRESETS.night3, seed } : { state: from });
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
