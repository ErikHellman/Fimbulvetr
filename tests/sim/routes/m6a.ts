import type { GameState } from '@core/state/gameState';
import { expect } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import { Harness, frameOf } from '../harness';
import { crossTo, finishStory, talkTo, walkTo } from '../walk';

function alive(h: Harness): void {
  expect(h.sim.mode, `fell on ${h.sim.screen.id}`).not.toBe('over');
  h.expectAnims();
}

/**
 * From the open pass (the Fimbulvetr) into Niflmýrr: Eldr melts the rime, the fog-marsh greets Ask, the bled
 * thrall at the drained camp tells the twist, and Hrafn takes Gamli's hook for the walrus-ivory comb.
 * Without `from`, the trading chain's first three steps (M5b) are granted at the seam.
 */
export function playM6a(seed: number, from?: GameState): Harness {
  const h = new Harness(from === undefined ? { preset: DEV_PRESETS.fimbul, seed } : { state: from });
  if (from === undefined) {
    h.sim.state.inv.items = { ...h.sim.state.inv.items, trade_hook: 1 };
    h.sim.state.flags.q_trade = 3;
  }
  h.idle(2);

  // Up the gorge to the rime, and Eldr into it.
  walkTo(h, 20, 3);
  h.press(['up']).idle(2);
  expect(h.sim.state.inv.galdr[0]).toBe('eldr');
  h.press(['galdr']).idle(60);
  expect(h.sim.state.flags.st_rime_open).toBe(true);

  // On north into the fog: Niflmýrr greets Ask at the gorge's mouth.
  h.until((s) => s.mode === 'story', 600, frameOf(['up']));
  expect(h.sim.screen.id).toBe('nif_gorge');
  finishStory(h);
  expect(h.sim.state.flags.st_niflmyrr_reached).toBe(true);
  alive(h);

  // West over the causeway and through the dead wood to the drained camp: the twist.
  walkTo(h, 1, 10);
  crossTo(h, 'w', 'nif_causeway');
  walkTo(h, 1, 6);
  crossTo(h, 'w', 'nif_deadwood');
  walkTo(h, 1, 13);
  crossTo(h, 'w', 'nif_camp');
  talkTo(h, 'thrall');
  expect(h.sim.state.flags.st_twist_heard).toBe(true);
  alive(h);

  // On to the shore and into Hrafn's hut: the hook for the comb.
  walkTo(h, 1, 10);
  crossTo(h, 'w', 'nif_shore');
  walkTo(h, 19, 10);
  h.until((s) => s.screen.id === 'nif_int_hut', 120, frameOf(['up']));
  h.idle(30);
  talkTo(h, 'hrafn');
  talkTo(h, 'hrafn');
  expect(h.sim.state.flags.q_trade).toBe(4);
  expect(h.sim.state.inv.items.trade_comb).toBe(1);
  alive(h);
  return h;
}
