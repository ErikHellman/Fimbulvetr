import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';

const RAID = { k: 'flag', id: 'st_raid_begun' } as const;

function stormy(things: Thing[] = []): ContentDb {
  return {
    ...DB,
    weather: [{ when: RAID, kind: 'storm' }],
    freezeClock: RAID,
    screens: { ...DB.screens, test_a: { ...DB.screens.test_a, things } },
  };
}

describe('story weather', () => {
  it('follows the first rule that holds, outdoors only', () => {
    const h = new Harness({ db: stormy() });
    expect(h.sim.weather()).toBe('clear');
    h.sim.state.flags.st_raid_begun = true;
    expect(h.sim.weather()).toBe('storm');
    h.sim.command({ t: 'warp', screen: 'test_int', x: 100, y: 100 });
    h.idle(1);
    expect(h.sim.weather()).toBe('clear');
  });
});

describe('clock freeze', () => {
  it('holds the minute while its condition holds', () => {
    const h = new Harness({ db: stormy(), minute: 60 });
    h.idle(600);
    expect(h.sim.state.clock.minute).toBeGreaterThan(60);
    h.sim.state.flags.st_raid_begun = true;
    const minute = h.sim.state.clock.minute;
    h.idle(3000);
    expect(h.sim.state.clock.minute).toBe(minute);
  });
});

describe('lights', () => {
  it('none by day; at night the lantern lights the hero only once owned', () => {
    expect(new Harness({ minute: 12 * 60 }).sim.lights()).toEqual([]);
    const h = new Harness({ minute: 60 });
    expect(h.sim.darkness()).toBeGreaterThan(0.5);
    expect(h.sim.lights()).toEqual([]);
    h.sim.state.inv.items.lantern = 1;
    const [lamp] = h.sim.lights();
    expect(lamp).toMatchObject({ x: h.sim.hero.pos.x, r: 56 });
  });

  it('burning fires glow in the dark', () => {
    const fire: Thing = { k: 'fire', at: { x: 5, y: 5 }, w: 2, h: 1, when: RAID };
    const h = new Harness({ db: stormy([fire]), minute: 60 });
    expect(h.sim.lights()).toHaveLength(0);
    h.sim.state.flags.st_raid_begun = true;
    h.idle(1);
    expect(h.sim.lights()).toHaveLength(2);
    expect(h.sim.darkness()).toBeGreaterThan(0.75);
  });
});
