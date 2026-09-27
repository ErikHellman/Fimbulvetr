import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import { Harness, frameOf } from './harness';

/** test_a and test_b moved onto the grid of dungeon 1 (their shared seam still matches). */
function underground(): ContentDb {
  const { test_a: _a, test_b: _b, ...world } = DB.layout.at;
  return {
    ...DB,
    layout: {
      ...DB.layout,
      at: world,
      dungeons: { d1: { cols: 2, rows: 1, at: { test_a: [0, 0], test_b: [1, 0] } } },
    },
    screens: {
      ...DB.screens,
      test_a: { ...DB.screens.test_a, dungeon: 'd1' },
      test_b: { ...DB.screens.test_b, dungeon: 'd1' },
    },
    weather: [{ when: { k: 'all', of: [] }, kind: 'storm' }],
  };
}

describe('dungeon rooms', () => {
  it('slide into each other like overworld screens', () => {
    const h = new Harness({ db: underground(), tile: [37, 11], facing: 'e' });
    h.until((s) => s.screen.id === 'test_b' && s.mode === 'play', 200, frameOf(['right']));
    expect(h.count('screenTransition')).toBe(1);
  });

  it('have no clock, no weather and no night', () => {
    const h = new Harness({ db: underground(), minute: 23 * 60 });
    h.idle(600);
    expect(h.sim.state.clock.minute).toBe(23 * 60);
    expect(h.sim.weather()).toBe('clear');
    expect(h.sim.darkness()).toBe(0);
  });
});
