import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { Season } from '@core/clock/types';
import type { ContentDb } from '@core/sim/db';
import { RAFT } from '@core/sim/systems/raft';
import { VINDR } from '@core/sim/systems/vindr';
import type { Thing } from '@core/world/screen';
import { Harness, frameOf } from './harness';

/** An open test_a (walls only round the edge) with the given things and rows replaced. */
function field(things: Thing[] = [], rows: Record<number, string> = {}): ContentDb {
  const map = Array.from(
    { length: 22 },
    (_, y) => rows[y] ?? (y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#'),
  );
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

function singer(db: ContentDb, season: Season = 'summer'): Harness {
  const h = new Harness({ db, tile: [5, 10], facing: 'e', season });
  h.sim.state.inv.galdr = ['vindr'];
  return h;
}

const gusts = (h: Harness) => h.sim.actors.filter((a) => a.kind === 'projectile' && a.def === 'vindr');

describe('Vindr', () => {
  it('costs three seiðr: Ask sings, and a gust blows the way Ask faces for a third of a second', () => {
    const h = singer(field());
    h.press(['galdr']);
    expect(h.sim.state.hero.seidr).toBe(7);
    expect(h.sim.hero.fsm.s).toBe('cast');
    expect(gusts(h)).toHaveLength(1);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_gust' });
    h.idle(4).expectAnims();
    h.idle(VINDR.ticks);
    expect(gusts(h)).toHaveLength(0);
  });

  it('pushes a foe in its path back two tiles, and leaves one behind Ask alone', () => {
    const h = singer(
      field([
        { k: 'enemy', id: 'dummy', at: { x: 9, y: 10 } },
        { k: 'enemy', id: 'dummy', at: { x: 2, y: 10 } },
      ]),
    );
    const [ahead, behind] = h.sim.enemies;
    if (ahead === undefined || behind === undefined) throw new Error('no dummies');
    const x0 = ahead.pos.x;
    const b0 = { ...behind.pos };
    h.press(['galdr']).idle(VINDR.ticks + 2);
    expect(ahead.pos.x - x0).toBeGreaterThanOrEqual(VINDR.push - 1);
    expect(ahead.pos.x - x0).toBeLessThanOrEqual(VINDR.push + 1);
    expect(ahead.hp).toBe(ahead.maxHp);
    expect(behind.pos).toEqual(b0);
  });

  it('reaches five tiles, no further', () => {
    const h = singer(field([{ k: 'enemy', id: 'dummy', at: { x: 12, y: 10 } }]));
    const far = h.sim.enemies[0];
    if (far === undefined) throw new Error('no dummy');
    const x0 = far.pos.x;
    h.press(['galdr']).idle(VINDR.ticks + 2);
    expect(far.pos.x).toBe(x0);
  });

  it('marks a boss it strikes (`mem.gust`) for its own behaviour to read, instead of shoving it', () => {
    const db = field([{ k: 'enemy', id: 'dummy', at: { x: 8, y: 10 } }]);
    const dummy = { ...db.enemies.dummy, boss: { name: { en: 'Boss', sv: 'Boss' } } };
    const h = singer({ ...db, enemies: { ...db.enemies, dummy } });
    const foe = h.sim.enemies[0];
    if (foe === undefined) throw new Error('no dummy');
    const x0 = foe.pos.x;
    h.press(['galdr']).idle(VINDR.ticks);
    expect(foe.mem['gust']).toBeGreaterThan(0);
    expect(foe.pos.x).toBe(x0);
  });

  it('blows leaf piles away down its lane', () => {
    const leafy = '#' + '.'.repeat(6) + '%%%' + '.'.repeat(29) + '#';
    const h = singer(field([], { 10: leafy }), 'autumn');
    h.press(['galdr']).idle(VINDR.ticks);
    expect([7, 8, 9].map((x) => h.sim.screen.cover.cleared[10 * 40 + x])).toEqual([1, 1, 1]);
    expect(h.events).toContainEqual({ t: 'coverChanged', screen: 'test_a' });
  });

  it('spins a wind fan, which sets its flag; the sword does nothing to it', () => {
    const fan: Thing = { k: 'switch', at: { x: 9, y: 10 }, set: 'w_myl_bridge', fan: true };
    const blade = singer(field([fan]));
    blade.sim.hero.pos = { x: 8 * 16 + 8, y: 10 * 16 + 14 };
    blade.press(['sword']).idle(20);
    expect(blade.sim.state.flags.w_myl_bridge).toBeUndefined();
    const h = singer(field([fan]));
    h.press(['galdr']).idle(VINDR.ticks);
    expect(h.sim.state.flags.w_myl_bridge).toBe(true);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_switch' });
  });

  it('fills a raft’s sail: a sailing raft never leaves its stop until a gust strikes it', () => {
    const pool = (y: number): string | undefined =>
      y >= 8 && y <= 12 ? '#' + '.'.repeat(6) + '~'.repeat(20) + '.'.repeat(12) + '#' : undefined;
    const rows: Record<number, string> = {};
    for (let y = 8; y <= 12; y++) rows[y] = pool(y) ?? '';
    const raft: Thing = { k: 'raft', at: { x: 7, y: 9 }, path: [{ x: 23, y: 9 }], sail: true };
    const h = singer(field([raft], rows));
    const deck = () => h.sim.actors.find((a) => a.def === 'raft');
    const x0 = deck()?.pos.x ?? 0;
    h.idle(RAFT.wait * 3);
    expect(deck()?.pos.x).toBe(x0);
    h.press(['galdr']);
    h.idle(RAFT.wait + 40);
    expect(deck()?.pos.x ?? 0).toBeGreaterThan(x0);
    h.step(frameOf([]));
  });
});
