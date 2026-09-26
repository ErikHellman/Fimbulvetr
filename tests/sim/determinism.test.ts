import { describe, expect, it } from 'vitest';
import { Harness, frameOf } from './harness';

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

  it('gives identical results across a screen transition plus a warp and a season change', () => {
    function crossing(h: Harness): Harness {
      h.until((sim) => sim.screen.id === 'test_b', 200, frameOf(['right']));
      h.sim.command({ t: 'warp', screen: 'test_b', x: h.sim.hero.pos.x, y: h.sim.hero.pos.y });
      h.sim.command({ t: 'setSeason', season: 'winter' });
      return h.idle(10);
    }
    const a = crossing(new Harness({ screen: 'test_a', tile: [37, 11] }));
    const b = crossing(new Harness({ screen: 'test_a', tile: [37, 11] }));
    expect(a.sim.screen.id).toBe('test_b');
    expect(a.sim.state.clock.season).toBe('winter');
    expect(a.sim.hash()).toBe(b.sim.hash());
  });
});
