import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import { killEnemy } from '@core/sim/systems/combat';
import { actorCtx } from '@core/sim/systems/enemies';
import { dungeonOf } from '@core/state/dungeons';
import { SOLID } from '@core/world/collision';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';

const NAME = { en: 'Test Wolf', sv: 'Testvarg' };

/** A d1 room with a wall down column 20 (a shuttered doorway at rows 9–10) and a boss vargr. */
function lair(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    const row = '#' + '.'.repeat(38) + '#';
    return y === 9 || y === 10 ? row : row.slice(0, 20) + '#' + row.slice(21);
  });
  const dead = { k: 'flag', id: 'st_raid_done' } as const;
  const things: Thing[] = [
    { k: 'shutter', at: { x: 20, y: 9 }, w: 1, h: 2, opens: 'clear' },
    {
      k: 'enemy',
      id: 'vargr',
      at: { x: 30, y: 10 },
      onDeath: [{ k: 'set', flag: 'st_raid_done', value: true }],
    },
    { k: 'heart', id: 'hc_test', at: { x: 30, y: 14 }, when: dead },
  ];
  const screen = { ...DB.screens.test_a, map, things, dungeon: 'd1' as const };
  const vargr = { ...DB.enemies.vargr, boss: { name: NAME } };
  return {
    ...DB,
    enemies: { ...DB.enemies, vargr },
    screens: { ...DB.screens, test_a: screen },
  };
}

const solid = (h: Harness, x: number, y: number): boolean =>
  ((h.sim.screen.collision.flags[y * 40 + x] ?? 0) & SOLID) !== 0;

describe('bosses', () => {
  it('show their name and health while they live', () => {
    expect(new Harness().sim.boss()).toBeNull();
    const h = new Harness({ db: lair(), tile: [24, 10] });
    expect(h.sim.boss()).toEqual({ name: NAME, hp: 6, maxHp: 6, phase: 0 });
  });

  it('when one dies, its deeds are done, its brood goes with it, and the room opens', () => {
    const h = new Harness({ db: lair(), tile: [24, 10] });
    h.sim.command({ t: 'god', on: true });
    h.idle(2);
    expect(solid(h, 20, 10)).toBe(true);
    actorCtx(h.sim).spawn('root_biter', { x: 100, y: 100 }, 's');
    const boss = h.sim.enemies.find((e) => e.def === 'vargr');
    if (boss === undefined) throw new Error('no boss');
    killEnemy(h.sim, boss, h.sim.db.enemies.vargr);
    h.idle(2);
    expect(h.sim.boss()).toBeNull();
    expect(h.sim.enemies).toHaveLength(0);
    expect(h.sim.state.flags.st_raid_done).toBe(true);
    expect(dungeonOf(h.sim.state, 'd1').bossDead).toBe(true);
    expect(h.sim.actors.find((a) => a.def === 'heart_container')?.mem['hidden']).toBe(0);
    expect(solid(h, 20, 10)).toBe(false);
    expect(h.events).toContainEqual({ t: 'bossDead' });
  });

  it('stay dead', () => {
    const h = new Harness({ db: lair(), tile: [24, 10] });
    dungeonOf(h.sim.state, 'd1').bossDead = true;
    h.sim.command({ t: 'warp', screen: 'test_a', x: 24 * 16 + 8, y: 10 * 16 + 14 });
    h.idle(1);
    expect(h.sim.enemies).toHaveLength(0);
    expect(h.sim.boss()).toBeNull();
  });

  it('keep their brood while they live', () => {
    const h = new Harness({ db: lair(), tile: [24, 10] });
    h.sim.command({ t: 'god', on: true });
    const pup = actorCtx(h.sim).spawn('root_biter', { x: 100, y: 100 }, 's');
    h.idle(1);
    expect(h.sim.enemies.map((e) => e.id)).toContain(pup.id);
  });
});
