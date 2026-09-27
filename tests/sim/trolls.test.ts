import { describe, expect, it } from 'vitest';
import { CLOCK_RULES } from '@content/clock';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';

/** test_a as an open field with the given things, in autumn (sunrise 05:00). */
function field(things: Thing[]): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

const TROLL: Thing = { k: 'enemy', id: 'forest_troll', at: { x: 30, y: 6 } };
const sunrise = CLOCK_RULES.sunrise.autumn;
const trolls = (h: Harness) => h.sim.actors.filter((a) => a.def === 'forest_troll');
const stones = (h: Harness) => h.sim.actors.filter((a) => a.def === 'troll_stone');

describe('forest trolls', () => {
  it('turn to stone where they stand at sunrise', () => {
    const h = new Harness({ db: field([TROLL]), season: 'autumn', minute: sunrise - 2, tile: [5, 18] });
    expect(trolls(h)).toHaveLength(1);
    h.until((s) => s.actors.some((a) => a.def === 'troll_stone'), 3 * 60 + 5);
    expect(trolls(h)).toHaveLength(0);
    expect(stones(h)).toHaveLength(1);
    expect(h.sim.state.clock.minute).toBe(sunrise);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_stone' });
    h.expectAnims();
  });

  it('cannot be hurt at night', () => {
    const h = new Harness({ db: field([TROLL]), season: 'autumn', minute: 60, tile: [5, 18] });
    h.sim.command({ t: 'killAll' });
    h.idle(1);
    expect(trolls(h)).toHaveLength(1);
  });

  it('leave a stone that Ask can lift, throw and break for silver', () => {
    const h = new Harness({
      db: field([TROLL]),
      season: 'autumn',
      minute: sunrise - 1,
      tile: [30, 12],
      facing: 'n',
    });
    h.until((s) => s.actors.some((a) => a.def === 'troll_stone'), 3 * 60 + 5);
    const stone = stones(h)[0];
    if (stone === undefined) throw new Error('no stone');
    // Stand just south of it, facing it, and lift.
    h.sim.hero.pos = { x: stone.pos.x, y: stone.pos.y + 14 };
    h.sim.hero.facing = 'n';
    h.press(['interact']).idle(20);
    expect(h.sim.hero.fsm.s).toBe('carry');
    // A throw needs a step: interact while walking.
    h.hold(['down', 'interact'], 1).idle(60);
    expect(stones(h)).toHaveLength(0);
    const drops = h.sim.actors.filter((a) => a.kind === 'pickup');
    expect(drops.filter((d) => d.def === 'silver')).toHaveLength(5);
    expect(drops.filter((d) => d.def === 'heart')).toHaveLength(1);
  });
});
