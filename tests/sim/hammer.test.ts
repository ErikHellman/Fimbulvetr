import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { blast } from '@core/sim/systems/bombs';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';

/** test_a as an open room with `things`. */
function room(things: Thing[]): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

/** Ask on (20, 10) facing east with the hammer in slot 1. */
function withHammer(things: Thing[]): Harness {
  const h = new Harness({ db: room(things), tile: [20, 10], facing: 'e' });
  h.sim.state.inv.items.hammer = 1;
  h.sim.state.inv.slots = ['hammer', null];
  return h;
}

const swing = (h: Harness): void => {
  h.press(['item1']).idle(30);
};

describe('the hammer', () => {
  it('breaks a weak floor and drives a stake down for good', () => {
    const h = withHammer([
      { k: 'crack', id: 't_floor', at: { x: 21, y: 10 }, w: 1, h: 1, art: 'floor' },
      { k: 'crack', id: 't_stake', at: { x: 21, y: 11 }, w: 1, h: 1, art: 'stake' },
    ]);
    swing(h);
    expect(h.sim.state.world.opened).toEqual(expect.arrayContaining(['t_floor', 't_stake']));
    expect(h.count('sfx')).toBeGreaterThan(0);
  });

  it('leaves rock alone, and a blast leaves a floor alone', () => {
    const h = withHammer([
      { k: 'crack', id: 't_rock', at: { x: 21, y: 10 }, w: 1, h: 1, art: 'rock' },
      { k: 'crack', id: 't_floor', at: { x: 25, y: 10 }, w: 1, h: 1, art: 'floor' },
    ]);
    swing(h);
    expect(h.sim.state.world.opened).not.toContain('t_rock');
    blast(h.sim, { x: 25 * 16 + 8, y: 10 * 16 + 14 });
    expect(h.sim.state.world.opened).not.toContain('t_floor');
  });

  it('cracks an iron warden’s plates, and then the sword bites', () => {
    const h = withHammer([{ k: 'enemy', id: 'jarnvordr', at: { x: 30, y: 10 } }]);
    h.idle(61);
    const foe = h.sim.enemies[0];
    if (foe === undefined) throw new Error('no warden');
    const hp = foe.hp;
    h.sim.hero.facing = 'e';
    h.press(['item1']);
    foe.pos = { x: h.sim.hero.pos.x + 18, y: h.sim.hero.pos.y };
    foe.iframes = 0;
    h.idle(12);
    expect(foe.mem['cracked']).toBe(1);
    expect(foe.hp).toBe(hp - DB.tuning.hero.hammerDamage);
  });

  it('only swings with the hammer owned, and stands still while it falls', () => {
    const h = withHammer([]);
    h.press(['item1']);
    expect(h.sim.hero.fsm.s).toBe('hammer');
    h.idle(30);
    expect(h.sim.hero.fsm.s).toBe('move');
    h.sim.state.inv.items.hammer = 0;
    h.press(['item1']);
    expect(h.sim.hero.fsm.s).toBe('move');
  });
});
