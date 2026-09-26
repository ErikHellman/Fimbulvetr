import { describe, expect, it } from 'vitest';
import { Harness, frameOf } from './harness';

/**
 * Pins the exact simulation result of a fixed script. Refactors must not change it. When a task changes
 * behaviour or what `hash()` covers on purpose, re-record the value in that task's commit and say why.
 */
function script(h: Harness): Harness {
  return h
    .hold(['right'], 40)
    .press(['sword'])
    .idle(10)
    .hold(['down', 'right'], 30)
    .press(['roll'])
    .idle(25)
    .hold(['shield', 'left'], 20)
    .hold(['sword'], 60)
    .idle(40)
    .until((sim) => sim.screen.id === 'test_b' && sim.mode === 'play', 400, frameOf(['right']));
}

describe('golden hash', () => {
  it('matches the recorded run', () => {
    const h = script(new Harness({ screen: 'test_a', tile: [20, 11] }));
    expect(h.sim.hash().toString(16)).toBe('b6ab359e');
  });
});
