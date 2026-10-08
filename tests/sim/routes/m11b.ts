import type { GameState } from '@core/state/gameState';
import { Harness } from '../harness';
import { crossTo, finishStory, walkTo } from '../walk';
import { alive } from './m7b';

/**
 * M11b: from the longhouse after the spring feast (the M11a save), out into the farmyard on the evening of
 * the feast. M11b changes no rules, so this short walk only carries the save forward for the 1.0.0 fixture.
 */
export function playM11b(from: GameState): Harness {
  const h = new Harness({ state: from });
  h.idle(2);
  walkTo(h, 19, 20);
  crossTo(h, 's', 'ask_farmyard', 300);
  if (h.sim.mode === 'story') finishStory(h);
  alive(h);
  return h;
}
