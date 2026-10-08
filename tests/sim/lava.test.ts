import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import { IS_CRUST_TICKS } from '@core/sim/systems/is';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';
import { heroTile } from './walk';

/** test_a with a lava channel down cols 14–16. */
function forge(things: Thing[] = []): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(13) + '≈≈≈' + '.'.repeat(22) + '#',
  );
  const screen = { ...DB.screens.test_a, map, things };
  return { ...DB, screens: { ...DB.screens, test_a: screen } };
}

describe('lava', () => {
  it('is no footing', () => {
    const h = new Harness({ db: forge(), tile: [12, 10], facing: 'e' });
    h.hold(['right'], 60);
    expect(heroTile(h.sim)[0]).toBe(13);
  });

  it('takes a crust from Ís, two tiles on at a time, that Ask can cross; the crust cools away', () => {
    const h = new Harness({ db: forge(), tile: [12, 10], facing: 'e' });
    h.sim.state.inv.galdr = ['is'];
    h.sim.state.hero.seidr = 10;
    h.press(['galdr']).idle(20);
    h.hold(['right'], 60);
    expect(heroTile(h.sim)[0]).toBe(15);
    h.press(['galdr']).idle(20);
    h.hold(['right'], 60);
    expect(heroTile(h.sim)[0]).toBeGreaterThan(16);
    h.idle(IS_CRUST_TICKS);
    h.hold(['left'], 80);
    expect(heroTile(h.sim)[0]).toBe(17);
  });

  it('does not cool under Ask', () => {
    const h = new Harness({ db: forge(), tile: [12, 10], facing: 'e' });
    h.sim.state.inv.galdr = ['is'];
    h.sim.state.hero.seidr = 10;
    h.press(['galdr']).idle(20);
    h.hold(['right'], 40);
    const [tx] = heroTile(h.sim);
    expect(tx).toBeGreaterThanOrEqual(14);
    const hp = h.sim.hero.hp;
    h.idle(IS_CRUST_TICKS + 30);
    expect(heroTile(h.sim)[0]).toBe(tx);
    expect(h.sim.hero.hp).toBe(hp);
  });

  it('burns a foe left on the crust when it cools', () => {
    const h = new Harness({
      db: forge([{ k: 'enemy', id: 'dummy', at: { x: 20, y: 4 } }]),
      tile: [12, 10],
      facing: 'e',
    });
    h.sim.state.inv.galdr = ['is'];
    h.sim.state.hero.seidr = 10;
    h.press(['galdr']).idle(20);
    const foe = h.sim.enemies[0];
    if (foe === undefined) throw new Error('no foe');
    foe.pos = { x: 15 * 16 + 8, y: 10 * 16 + 14 };
    expect(h.sim.enemies).toHaveLength(1);
    h.idle(IS_CRUST_TICKS);
    expect(h.sim.enemies).toHaveLength(0);
  });
});
