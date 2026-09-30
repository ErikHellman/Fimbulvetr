import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import type { TilePos } from '@core/world/screen';
import { rollSpawns, type SpawnTable } from '@core/world/spawns';
import { spawnActors } from '@core/sim/systems/spawn';
import { Harness } from './harness';

const TABLE: SpawnTable = {
  count: { summer: 2, winter: 1 },
  entries: {
    summer: [
      { id: 'vargr', weight: 1, time: 'day' },
      { id: 'draugr', weight: 1, time: 'night' },
    ],
    winter: [{ id: 'vargr', weight: 1 }],
  },
};

const POINTS: TilePos[] = Array.from({ length: 8 }, (_, i) => ({ x: 4 + i * 4, y: 4 + (i % 3) * 5 }));

/** test_a as an open field with spawn points and a table for its region (askdalr). */
function spawnDb(opts: { dungeon?: boolean; points?: TilePos[] } = {}): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  const screen = {
    ...DB.screens.test_a,
    map,
    things: [],
    spawns: opts.points ?? POINTS,
    ...(opts.dungeon === true ? { dungeon: 'd1' as const } : {}),
  };
  return { ...DB, spawns: { askdalr: TABLE }, screens: { ...DB.screens, test_a: screen } };
}

const rolled = (h: Harness) => h.sim.actors.filter((a) => a.kind === 'enemy' && a.mem['rolled'] === 1);
const tiles = (h: Harness) =>
  rolled(h).map((e) => `${e.def}@${Math.floor(e.pos.x / 16)},${Math.floor((e.pos.y - 1) / 16)}`);

describe('rollSpawns', () => {
  it('is pure, keeps to its count, and doubles it at night', () => {
    const free = (): boolean => true;
    const a = rollSpawns(TABLE, 'summer', false, POINTS, 7, free);
    expect(a).toEqual(rollSpawns(TABLE, 'summer', false, POINTS, 7, free));
    expect(a).toHaveLength(2);
    expect(a.every((r) => r.id === 'vargr')).toBe(true);
    const night = rollSpawns(TABLE, 'summer', true, POINTS, 7, free);
    expect(night).toHaveLength(4);
    expect(night.every((r) => r.id === 'draugr')).toBe(true);
    expect(rollSpawns(TABLE, 'autumn', false, POINTS, 7, free)).toEqual([]);
  });

  it('skips points it may not use and never takes more than there are', () => {
    const only = POINTS[3];
    const r = rollSpawns(TABLE, 'summer', true, POINTS, 7, (p) => p === only);
    expect(r).toEqual([{ id: 'draugr', at: only }]);
  });
});

describe('rolled spawns on a screen', () => {
  it('bring the same foes to the same places for the same seed, day and screen', () => {
    const a = new Harness({ db: spawnDb(), rolled: true, tile: [20, 20], minute: 12 * 60 });
    const b = new Harness({ db: spawnDb(), rolled: true, tile: [20, 20], minute: 12 * 60 });
    expect(tiles(a)).toHaveLength(2);
    expect(tiles(a)).toEqual(tiles(b));
    const other = new Harness({ db: spawnDb(), rolled: true, tile: [20, 20], minute: 12 * 60, seed: 99 });
    expect(tiles(other)).toHaveLength(2);
  });

  it('come out doubled at night, and nothing is rolled while rolling is off', () => {
    const night = new Harness({ db: spawnDb(), rolled: true, tile: [20, 20], minute: 0 });
    expect(rolled(night).map((e) => e.def)).toEqual(['draugr', 'draugr', 'draugr', 'draugr']);
    expect(rolled(new Harness({ db: spawnDb(), tile: [20, 20], minute: 0 }))).toEqual([]);
  });

  it('never touch the combat RNG', () => {
    const h = new Harness({ db: spawnDb(), rolled: true, tile: [20, 20], minute: 12 * 60 });
    const rng = { ...h.sim.state.rng };
    spawnActors(h.sim);
    expect(rolled(h).length).toBeGreaterThan(0);
    expect(h.sim.state.rng).toEqual(rng);
  });

  it('keep clear of where Ask arrives', () => {
    const near: TilePos[] = [
      { x: 20, y: 18 },
      { x: 22, y: 19 },
      { x: 5, y: 5 },
    ];
    const h = new Harness({ db: spawnDb({ points: near }), rolled: true, tile: [20, 20], minute: 12 * 60 });
    expect(tiles(h)).toEqual(['vargr@5,5']);
  });

  it('leave out foes Ask has no way to beat yet (mud-crabs before bombs)', () => {
    const crabs: SpawnTable = {
      count: { summer: 2 },
      entries: { summer: [{ id: 'leirkrabbi', weight: 1 }] },
    };
    const db = (): ContentDb => ({ ...spawnDb(), spawns: { askdalr: crabs } });
    const before = new Harness({ db: db(), rolled: true, tile: [20, 20], minute: 12 * 60 });
    expect(rolled(before)).toEqual([]);
    const after = new Harness({ db: db(), rolled: true, tile: [20, 20], minute: 12 * 60 });
    after.sim.state.inv.items.bombs = 0;
    spawnActors(after.sim);
    expect(rolled(after).map((e) => e.def)).toEqual(['leirkrabbi', 'leirkrabbi']);
  });

  it('never happen underground', () => {
    const h = new Harness({ db: spawnDb({ dungeon: true }), rolled: true, tile: [20, 20], minute: 12 * 60 });
    expect(rolled(h)).toEqual([]);
  });
});
