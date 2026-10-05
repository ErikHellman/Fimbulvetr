import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness, frameOf } from './harness';
import { heroTile } from './walk';

/**
 * Sökkva Hof's flooded floors on test_a, under D5's water level: crypt floor on cols 1–9 and 30–38, a
 * flagstone floor that floods at level 1 between (cols 10–29), and on row 5 a sunken arch (cols 18–21)
 * over open water, which only a diver passes under.
 */
function hall(rows: Record<number, string> = {}, things: Thing[] = []): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (rows[y] !== undefined) return rows[y];
    if (y === 0 || y === 21) return '8'.repeat(40);
    return '8' + '7'.repeat(9) + '@'.repeat(20) + '7'.repeat(9) + '8';
  });
  const screen = { ...DB.screens.test_a, map, things, water: 'w_d5_level' as const };
  return { ...DB, screens: { ...DB.screens, test_a: screen } };
}

/** A channel of deep water across the room (rows 3–8) with an arch over cols 18–21 that walls it off. */
const CHANNEL: Record<number, string> = {};
for (let y = 3; y <= 8; y++)
  CHANNEL[y] = '8' + '7'.repeat(9) + '~'.repeat(8) + '((((' + '~'.repeat(8) + '7'.repeat(9) + '8';

function skin(h: Harness): Harness {
  h.sim.state.inv.items.sealskin = 1;
  return h;
}

describe('flooded floors', () => {
  it('are dry flagstones at low water: Ask walks them', () => {
    const h = skin(new Harness({ db: hall(), tile: [9, 15], facing: 'e' }));
    h.hold(['right'], 60);
    expect(heroTile(h.sim)[0]).toBeGreaterThan(12);
    expect(h.sim.hero.fsm.s).toBe('move');
  });

  it('are deep water once the level rises: swum with the seal-skin, a wall without it', () => {
    const swimmer = skin(new Harness({ db: hall(), tile: [9, 15], facing: 'e' }));
    swimmer.sim.state.flags.w_d5_level = 1;
    swimmer.idle(2);
    swimmer.until((s) => s.hero.fsm.s === 'swim', 60, frameOf(['right']));
    const walker = new Harness({ db: hall(), tile: [9, 15], facing: 'e' });
    walker.sim.state.flags.w_d5_level = 1;
    walker.idle(2).hold(['right'], 60);
    expect(heroTile(walker.sim)[0]).toBe(9);
  });

  it('drown a walking foe left on them when the water rises', () => {
    const h = skin(
      new Harness({ db: hall({}, [{ k: 'enemy', id: 'vargr', at: { x: 20, y: 15 } }]), tile: [4, 15] }),
    );
    expect(h.sim.enemies).toHaveLength(1);
    h.sim.state.flags.w_d5_level = 1;
    h.idle(3);
    expect(h.sim.enemies).toHaveLength(0);
  });
});

describe('sunken arches', () => {
  it('wall off a swimmer, and pass a diver under them', () => {
    const h = skin(new Harness({ db: hall(CHANNEL), tile: [9, 5], facing: 'e' }));
    h.until((s) => s.hero.fsm.s === 'swim', 60, frameOf(['right']));
    h.hold(['right'], 120);
    expect(heroTile(h.sim)[0]).toBeLessThan(18);
    h.step(frameOf(['right'], ['roll']));
    expect(h.sim.hero.fsm.s).toBe('dive');
    h.until((s) => heroTile(s)[0] >= 22, 200, frameOf(['right']));
  });

  it('keep a diver under until Ask is out from beneath them', () => {
    const h = skin(new Harness({ db: hall(CHANNEL), tile: [17, 5], facing: 'e' }));
    h.idle(2);
    // Under the arch, at the end of the dive's breath: Ask stays down and drifts on with the steering.
    h.sim.hero.pos = { x: 19 * 16 + 8, y: 5 * 16 + 14 };
    h.step(frameOf([], ['roll']));
    h.until((s) => s.hero.fsm.t >= DB.tuning.hero.diveTicks + 4, 300);
    expect(h.sim.hero.fsm.s).toBe('dive');
    h.until((s) => s.hero.fsm.s === 'swim', 200, frameOf(['right']));
    expect(heroTile(h.sim)[0]).toBeGreaterThanOrEqual(22);
  });
});

describe('the drowned', () => {
  it('walks the flooded floor and the dry floor alike, and is a foe to be fought', () => {
    const def = DB.enemies.drowned;
    expect(def.swims).toBe(true);
    expect(def.attacks).toBeDefined();
    const h = skin(
      new Harness({ db: hall({}, [{ k: 'enemy', id: 'drowned', at: { x: 20, y: 15 } }]), tile: [4, 15] }),
    );
    h.sim.state.flags.w_d5_level = 1;
    h.idle(3);
    expect(h.sim.enemies).toHaveLength(1);
    h.idle(200).expectAnims();
  });
});
