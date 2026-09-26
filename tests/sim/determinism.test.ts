import { describe, expect, it } from 'vitest';
import { Harness } from './harness';

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
    .idle(40);
}

describe('determinism', () => {
  it('gives identical results for identical input', () => {
    const a = script(new Harness({ tile: [10, 11] }));
    const b = script(new Harness({ tile: [10, 11] }));
    expect(a.sim.tick).toBeGreaterThan(200);
    expect(a.sim.hash()).toBe(b.sim.hash());
  });

  it('diverges when the input differs', () => {
    const a = script(new Harness({ tile: [10, 11] }));
    const b = script(new Harness({ tile: [10, 11] }).idle(1));
    expect(a.sim.hash()).not.toBe(b.sim.hash());
  });
});
