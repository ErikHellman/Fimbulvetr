import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import { Harness, frameOf } from './harness';

/**
 * A lake on test_a (cols 10–29) with a dive door at (15, 10) down to test_b, as at Sökkva Hof's spire: a
 * swimmer passes over it, and only a dive takes Ask down.
 */
function lake(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    return '#' + '.'.repeat(9) + '~'.repeat(20) + '.'.repeat(9) + '#';
  });
  const screen = {
    ...DB.screens.test_a,
    map,
    things: [
      {
        k: 'door' as const,
        at: { x: 15, y: 10 },
        dir: 'e' as const,
        to: 'test_b' as const,
        arrive: { x: 5, y: 5 },
        facing: 's' as const,
        dive: true as const,
      },
    ],
  };
  return { ...DB, screens: { ...DB.screens, test_a: screen } };
}

function swimmer(): Harness {
  const h = new Harness({ db: lake(), tile: [9, 10], facing: 'e' });
  h.sim.state.inv.items.sealskin = 1;
  return h;
}

describe('dive doors', () => {
  it('show a ripple on the water over them', () => {
    const h = swimmer();
    expect(h.sim.actors.some((a) => a.kind === 'fixture' && a.art === 'fix_ripple')).toBe(true);
  });

  it('let a swimmer pass over them', () => {
    const h = swimmer();
    h.until((s) => s.hero.pos.x > 18 * 16, 200, frameOf(['right']));
    expect(h.sim.screen.id).toBe('test_a');
  });

  it('take a diver down', () => {
    const h = swimmer();
    h.until((s) => s.hero.pos.x > 14 * 16 + 4, 200, frameOf(['right']));
    h.step(frameOf(['right'], ['roll']));
    h.until((s) => s.screen.id === 'test_b', 200, frameOf(['right']));
  });
});
