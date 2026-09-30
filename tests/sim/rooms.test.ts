import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import { dungeonOf } from '@core/state/dungeons';
import { SOLID } from '@core/world/collision';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';
import { face, walkTo } from './walk';

/** A room of d1: a wall down column 20 with a doorway at rows 9–10, where `door` things sit. */
function room(things: Thing[], opts: { dark?: boolean } = {}): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    const row = '#' + '.'.repeat(38) + '#';
    return y === 9 || y === 10 ? row : row.slice(0, 20) + '#' + row.slice(21);
  });
  const screen = { ...DB.screens.test_a, map, things, dungeon: 'd1' as const, ...opts };
  return { ...DB, screens: { ...DB.screens, test_a: screen, test_b: { ...screen, id: 'test_b' as const } } };
}

const solid = (h: Harness, x: number, y: number): boolean =>
  ((h.sim.screen.collision.flags[y * 40 + x] ?? 0) & SOLID) !== 0;
const fixtures = (h: Harness, def: string) =>
  h.sim.actors.filter((a) => a.kind === 'fixture' && a.def === def);
const warp = (h: Harness, screen: 'test_a' | 'test_b', x: number, y: number): Harness => {
  h.sim.command({ t: 'warp', screen, x: x * 16 + 8, y: y * 16 + 14 });
  return h.idle(1);
};

const LOCK: Thing = { k: 'lock', id: 'd1_lock_test', at: { x: 20, y: 9 }, w: 1, h: 2 };

describe('locked doors', () => {
  it('stay shut without a key', () => {
    const h = new Harness({ db: room([LOCK]), tile: [17, 10], facing: 'e' });
    expect(solid(h, 20, 9) && solid(h, 20, 10)).toBe(true);
    h.hold(['right'], 60);
    expect(h.sim.hero.pos.x).toBeLessThan(20 * 16);
    expect(fixtures(h, 'lock').every((f) => f.anim === 'closed')).toBe(true);
  });

  it('spend one key when Ask walks into them, and stay open from both sides', () => {
    const h = new Harness({ db: room([LOCK]), tile: [17, 10], facing: 'e' });
    dungeonOf(h.sim.state, 'd1').keys = 2;
    h.hold(['right'], 60);
    expect(dungeonOf(h.sim.state, 'd1')).toMatchObject({ keys: 1, doors: ['d1_lock_test'] });
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_unlock' });
    expect(solid(h, 20, 9) || solid(h, 20, 10)).toBe(false);
    walkTo(h, 24, 10);
    // The same door seen from the next room is open too.
    warp(h, 'test_b', 24, 10);
    expect(fixtures(h, 'lock').every((f) => f.anim === 'open')).toBe(true);
    expect(solid(h, 20, 10)).toBe(false);
    expect(dungeonOf(h.sim.state, 'd1').keys).toBe(1);
  });
});

describe('the big lock', () => {
  const BIG: Thing = { k: 'lock', id: 'd1_big_test', at: { x: 20, y: 9 }, w: 1, h: 2, big: true };

  it('turns small keys away', () => {
    const h = new Harness({ db: room([BIG]), tile: [17, 10], facing: 'e' });
    dungeonOf(h.sim.state, 'd1').keys = 2;
    h.hold(['right'], 60);
    expect(dungeonOf(h.sim.state, 'd1')).toMatchObject({ keys: 2, doors: [] });
    expect(solid(h, 20, 10)).toBe(true);
    expect(fixtures(h, 'lock').every((f) => f.art === 'fix_biglock' && f.anim === 'closed')).toBe(true);
    h.expectAnims();
  });

  it('opens for good with the big key, which is kept', () => {
    const h = new Harness({ db: room([BIG]), tile: [17, 10], facing: 'e' });
    dungeonOf(h.sim.state, 'd1').bigKey = true;
    h.hold(['right'], 60);
    expect(dungeonOf(h.sim.state, 'd1')).toMatchObject({ bigKey: true, keys: 0, doors: ['d1_big_test'] });
    expect(solid(h, 20, 9) || solid(h, 20, 10)).toBe(false);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_unlock' });
    h.expectAnims();
  });
});

describe('shutters', () => {
  const SHUTTER: Thing = { k: 'shutter', at: { x: 20, y: 9 }, w: 1, h: 2, opens: 'clear' };
  const FOE: Thing = { k: 'enemy', id: 'vargr', at: { x: 34, y: 16 } };

  it('wait for Ask to step through, slam shut, and open when the room is clear', () => {
    const h = new Harness({ db: room([SHUTTER, FOE]), tile: [20, 10] });
    h.sim.command({ t: 'god', on: true });
    h.idle(10);
    expect(solid(h, 20, 10)).toBe(false);
    walkTo(h, 23, 10);
    h.idle(1);
    expect(solid(h, 20, 9) && solid(h, 20, 10)).toBe(true);
    expect(fixtures(h, 'shutter').every((f) => f.anim === 'closed')).toBe(true);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_shutter' });
    h.sim.command({ t: 'killAll' });
    h.idle(2);
    expect(solid(h, 20, 10)).toBe(false);
    expect(fixtures(h, 'shutter').every((f) => f.anim === 'open')).toBe(true);
  });

  it('close again on the next visit, unless they have an id', () => {
    const h = new Harness({ db: room([SHUTTER, FOE]), tile: [23, 10] });
    h.sim.command({ t: 'killAll' });
    h.idle(2);
    warp(h, 'test_a', 24, 10).idle(2);
    expect(solid(h, 20, 10)).toBe(true);

    const saved = new Harness({ db: room([{ ...SHUTTER, id: 'd1_sh_test' }, FOE]), tile: [23, 10] });
    saved.sim.command({ t: 'killAll' });
    saved.idle(2);
    expect(dungeonOf(saved.sim.state, 'd1').doors).toEqual(['d1_sh_test']);
    warp(saved, 'test_a', 24, 10).idle(2);
    expect(solid(saved, 20, 10)).toBe(false);
  });

  it('stay open while `when` fails', () => {
    const when = { k: 'flag', id: 'st_raid_done' } as const;
    const h = new Harness({ db: room([{ ...SHUTTER, when }, FOE]), tile: [23, 10] });
    h.idle(4);
    expect(solid(h, 20, 10)).toBe(false);
    h.sim.state.flags.st_raid_done = true;
    h.idle(1);
    expect(solid(h, 20, 10)).toBe(true);
  });
});

describe('switches', () => {
  const things: Thing[] = [
    { k: 'shutter', at: { x: 20, y: 9 }, w: 1, h: 2, opens: 'switches' },
    { k: 'switch', at: { x: 26, y: 10 } },
    { k: 'switch', at: { x: 26, y: 14 } },
  ];

  it('light when struck, and every lit switch opens the way', () => {
    const h = new Harness({ db: room(things), tile: [23, 10] });
    h.idle(2);
    expect(solid(h, 20, 10)).toBe(true);
    expect(solid(h, 26, 10)).toBe(true);
    walkTo(h, 25, 10);
    face(h, 'e');
    h.press(['sword']).idle(20);
    expect(fixtures(h, 'switch').map((s) => s.anim)).toEqual(['on', 'off']);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_switch' });
    expect(solid(h, 20, 10)).toBe(true);
    walkTo(h, 25, 14);
    face(h, 'e');
    h.press(['sword']).idle(20);
    expect(fixtures(h, 'switch').map((s) => s.anim)).toEqual(['on', 'on']);
    expect(solid(h, 20, 10)).toBe(false);
  });
});

describe('braziers', () => {
  const things: Thing[] = [
    { k: 'shutter', at: { x: 20, y: 9 }, w: 1, h: 2, opens: 'braziers' },
    { k: 'brazier', at: { x: 26, y: 10 } },
    { k: 'brazier', at: { x: 30, y: 10 }, lit: true },
  ];

  it('take the flame from the lantern in an item slot, and light the dark', () => {
    const h = new Harness({ db: room(things, { dark: true }), tile: [23, 10] });
    h.sim.state.inv.items.lantern = 1;
    h.sim.state.inv.slots = ['lantern', null];
    h.idle(2);
    const glow = () => h.sim.lights().filter((l) => l.hero !== true).length;
    expect(glow()).toBe(1);
    expect(solid(h, 20, 10)).toBe(true);
    walkTo(h, 25, 10);
    face(h, 'e');
    h.press(['item1']).idle(2);
    expect(fixtures(h, 'brazier').map((b) => b.anim)).toEqual(['burn', 'burn']);
    expect(glow()).toBe(2);
    expect(solid(h, 20, 10)).toBe(false);
  });

  it('stay cold without the lantern', () => {
    const h = new Harness({ db: room(things), tile: [25, 10], facing: 'e' });
    h.press(['item1']).idle(2);
    expect(fixtures(h, 'brazier').map((b) => b.anim)).toEqual(['out', 'burn']);
  });
});
