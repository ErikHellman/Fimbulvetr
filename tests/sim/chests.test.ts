import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import { dungeonOf } from '@core/state/dungeons';
import { SOLID } from '@core/world/collision';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';
import { finishStory, interactNorth, walkTo } from './walk';

/** test_a opened up with `things`; a room of dungeon d1 when `dungeon` is set. */
function room(things: Thing[], dungeon = false): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  const screen = { ...DB.screens.test_a, map, things, ...(dungeon ? { dungeon: 'd1' as const } : {}) };
  return { ...DB, screens: { ...DB.screens, test_a: screen } };
}

const solid = (h: Harness, x: number, y: number): boolean =>
  ((h.sim.screen.collision.flags[y * 40 + x] ?? 0) & SOLID) !== 0;
const chests = (h: Harness) => h.sim.actors.filter((a) => a.kind === 'fixture' && a.def === 'chest');

const BOOMERANG: Thing = { k: 'chest', id: 'c_test', at: { x: 20, y: 8 }, gives: { item: 'boomerang' } };

describe('chests', () => {
  it('open on interact: the gift, a found line, and saved as opened', () => {
    const h = new Harness({ db: room([BOOMERANG]), tile: [20, 12] });
    expect(solid(h, 20, 8)).toBe(true);
    expect(chests(h).map((c) => c.anim)).toEqual(['closed']);
    interactNorth(h, 20, 8).idle(1);
    expect(h.sim.mode).toBe('story');
    expect(h.sim.storyUi()).toMatchObject({ k: 'text', text: DB.items.boomerang.found });
    expect(h.count('sfx')).toBeGreaterThan(0);
    finishStory(h);
    expect(h.sim.state.inv.items.boomerang).toBe(1);
    expect(h.sim.state.world.opened).toEqual(['c_test']);
    expect(chests(h).map((c) => c.anim)).toEqual(['open']);
    expect(solid(h, 20, 8)).toBe(true);
    // An open chest is empty.
    h.step(h.frame([])).press(['interact']);
    expect(h.sim.mode).toBe('play');
    expect(h.sim.state.inv.items.boomerang).toBe(1);
  });

  it('stay open when the room is entered again', () => {
    const h = new Harness({ db: room([BOOMERANG]), tile: [20, 12] });
    h.sim.state.world.opened.push('c_test');
    h.sim.command({ t: 'warp', screen: 'test_a', x: 20 * 16 + 8, y: 12 * 16 + 14 });
    h.idle(1);
    expect(chests(h).map((c) => c.anim)).toEqual(['open']);
    interactNorth(h, 20, 8);
    expect(h.sim.mode).toBe('play');
    expect(h.sim.state.inv.items.boomerang).toBeUndefined();
  });

  it('hold silver', () => {
    const silver: Thing = {
      k: 'chest',
      id: 'c_silver',
      at: { x: 20, y: 8 },
      gives: { silver: 20, text: { en: 'Twenty silver!', sv: 'Tjugo silver!' } },
    };
    const h = new Harness({ db: room([silver]), tile: [20, 12] });
    const before = h.sim.state.hero.silver;
    interactNorth(h, 20, 8).idle(1);
    expect(h.sim.storyUi()).toMatchObject({ text: { en: 'Twenty silver!' } });
    finishStory(h);
    expect(h.sim.state.hero.silver).toBe(before + 20);
  });

  it("put keys, the map and the compass into the dungeon's state, not the bag", () => {
    const gifts = ['small_key', 'small_key', 'big_key', 'dungeon_map', 'compass'] as const;
    const things: Thing[] = gifts.map((item, i) => ({
      k: 'chest',
      id: `c_${String(i)}`,
      at: { x: 10 + i * 4, y: 8 },
      gives: { item },
    }));
    const h = new Harness({ db: room(things, true), tile: [10, 12] });
    for (let i = 0; i < gifts.length; i++) {
      interactNorth(h, 10 + i * 4, 8);
      finishStory(h);
    }
    expect(dungeonOf(h.sim.state, 'd1')).toMatchObject({ keys: 2, bigKey: true, map: true, compass: true });
    for (const item of gifts) expect(h.sim.state.inv.items[item]).toBeUndefined();
  });

  it('appear once the room is clear, never on top of Ask', () => {
    const things: Thing[] = [
      { ...BOOMERANG, appear: 'clear' },
      { k: 'enemy', id: 'vargr', at: { x: 30, y: 16 } },
      { k: 'enemy', id: 'dummy', at: { x: 4, y: 4 } },
    ];
    const h = new Harness({ db: room(things), tile: [20, 8] });
    h.sim.command({ t: 'god', on: true });
    const [chest] = chests(h);
    expect(chest?.mem['hidden']).toBe(1);
    expect(solid(h, 20, 8)).toBe(false);
    h.sim.command({ t: 'killAll' });
    h.idle(2);
    // The immortal dummy does not count, but Ask is standing on the spot.
    expect(chest?.mem['hidden']).toBe(1);
    walkTo(h, 20, 11);
    h.idle(2);
    expect(chest?.mem['hidden']).toBe(0);
    expect(solid(h, 20, 8)).toBe(true);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_secret' });
  });

  it('hidden ones cannot be opened', () => {
    const things: Thing[] = [
      { ...BOOMERANG, appear: 'clear' },
      { k: 'enemy', id: 'vargr', at: { x: 30, y: 16 } },
    ];
    const h = new Harness({ db: room(things), tile: [20, 12] });
    h.sim.command({ t: 'god', on: true });
    interactNorth(h, 20, 8);
    expect(h.sim.mode).toBe('play');
    expect(h.sim.state.world.opened).toEqual([]);
  });
});

describe('the heart container', () => {
  const HEART: Thing = {
    k: 'heart',
    id: 'hc_test',
    at: { x: 20, y: 8 },
    when: { k: 'flag', id: 'st_raid_done' },
  };

  it('appears when its flag is set, and adds a heart and refills health', () => {
    const h = new Harness({ db: room([HEART]), tile: [20, 12] });
    const heart = h.sim.actors.find((a) => a.kind === 'pickup' && a.def === 'heart_container');
    expect(heart?.mem['hidden']).toBe(1);
    walkTo(h, 20, 8);
    expect(h.sim.state.world.opened).toEqual([]);
    walkTo(h, 20, 12);
    h.sim.state.flags.st_raid_done = true;
    h.sim.command({ t: 'setHp', hp: 3 });
    h.idle(2);
    expect(heart?.mem['hidden']).toBe(0);
    const max = h.sim.hero.maxHp;
    h.until((s) => s.mode === 'story', 200, h.frame(['up'])).idle(1);
    expect(h.sim.storyUi()).toMatchObject({ text: DB.items.heart_container.found });
    finishStory(h);
    expect(h.sim.hero.maxHp).toBe(max + 4);
    expect(h.sim.hero.hp).toBe(max + 4);
    expect(h.sim.state.world.opened).toEqual(['hc_test']);
    expect(h.sim.state.inv.items.heart_container).toBe(1);
  });

  it('is gone for good once taken', () => {
    const h = new Harness({ db: room([HEART]), tile: [20, 12] });
    h.sim.state.flags.st_raid_done = true;
    h.sim.state.world.opened.push('hc_test');
    h.sim.command({ t: 'warp', screen: 'test_a', x: 20 * 16 + 8, y: 12 * 16 + 14 });
    h.idle(1);
    expect(h.sim.actors.some((a) => a.def === 'heart_container')).toBe(false);
  });
});
