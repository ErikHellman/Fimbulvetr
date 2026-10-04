import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import { FOG_ROOM_RADIUS, FOG_THICK, LANTERN_RADIUS } from '@core/world/light';
import { Harness } from './harness';

/** test_a as a fog room. */
const foggy: ContentDb = {
  ...DB,
  screens: { ...DB.screens, test_a: { ...DB.screens.test_a, fog: true } },
};

describe('a fog room', () => {
  it('is thick with fog whatever the sky, with only a small clear circle round Ask', () => {
    const h = new Harness({ db: foggy, tile: [10, 10] });
    h.sim.state.inv.items.lantern = 0;
    expect(h.sim.fog()).toEqual({ amount: FOG_THICK, r: FOG_ROOM_RADIUS });
  });

  it('the lantern widens the circle to its own light, and no further', () => {
    const h = new Harness({ db: foggy, tile: [10, 10] });
    h.sim.state.inv.items.lantern = 1;
    expect(h.sim.fog()).toEqual({ amount: FOG_THICK, r: LANTERN_RADIUS });
    expect(h.sim.lights().some((l) => l.hero === true)).toBe(true);
  });

  it('Ljós burns it away', () => {
    const h = new Harness({ db: foggy, tile: [10, 10] });
    h.sim.hero.mem['ljosT'] = 100;
    expect(h.sim.fog().amount).toBe(0);
  });
});
