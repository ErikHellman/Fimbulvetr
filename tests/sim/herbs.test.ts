import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';
import { walkTo } from './walk';

/** test_a opened up, with a clump of fen-moss that grows in autumn at (20,10). */
function meadow(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  const things: Thing[] = [
    { k: 'herb', id: 'herb_test', item: 'fen_moss', at: { x: 20, y: 10 }, season: 'autumn' },
  ];
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

const herbs = (h: Harness) => h.sim.actors.filter((a) => a.kind === 'pickup' && a.def === 'herb_fen_moss');
const reenter = (h: Harness) => {
  h.sim.command({ t: 'warp', screen: 'test_a', x: 12 * 16 + 8, y: 10 * 16 + 14 });
  h.idle(2);
};

describe('seasonal herbs', () => {
  it('grow only in their season', () => {
    const summer = new Harness({ db: meadow(), tile: [12, 10], season: 'summer' });
    summer.idle(2);
    expect(herbs(summer)).toHaveLength(0);
    const autumn = new Harness({ db: meadow(), tile: [12, 10], season: 'autumn' });
    autumn.idle(2);
    expect(herbs(autumn)).toHaveLength(1);
  });

  it('are picked once a season and grow back the next year', () => {
    const h = new Harness({ db: meadow(), tile: [12, 10], season: 'autumn' });
    h.idle(2);
    walkTo(h, 20, 10);
    h.idle(2);
    expect(h.sim.state.inv.items.fen_moss).toBe(1);
    expect(herbs(h)).toHaveLength(0);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_pickup' });
    reenter(h);
    expect(herbs(h)).toHaveLength(0);
    for (const season of ['winter', 'spring', 'summer', 'autumn'] as const)
      h.sim.command({ t: 'setSeason', season });
    reenter(h);
    expect(herbs(h)).toHaveLength(1);
  });
});
