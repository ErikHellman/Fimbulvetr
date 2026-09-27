import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { DungeonId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import { newGame } from '@core/state/gameState';
import { TEST_START } from '@content/start';
import { dungeonMap } from '@core/world/mapModel';
import type { ScreenDef, Thing, WorldLayout } from '@core/world/screen';

/** A 2×2 floor of d1 (ids borrowed from content): a boss room, a chest room, an entrance, an empty room. */
const LAYOUT: WorldLayout = {
  ...DB.layout,
  dungeons: {
    d1: { cols: 2, rows: 2, at: { test_a: [0, 0], test_b: [1, 0], test_c: [0, 1], test_int: [1, 1] } },
  },
};
const room = (id: ScreenId, things: Thing[]): ScreenDef => ({ ...DB.screens[id], things, dungeon: 'd1' });
const SCREENS = {
  ...DB.screens,
  test_a: room('test_a', [{ k: 'enemy', id: 'rotvaettr', at: { x: 20, y: 5 } }]),
  test_b: room('test_b', [
    { k: 'chest', id: 'c1', at: { x: 5, y: 5 }, gives: { item: 'small_key' } },
    { k: 'chest', id: 'c2', at: { x: 9, y: 5 }, gives: { item: 'compass' } },
  ]),
  test_c: room('test_c', []),
  test_int: room('test_int', [{ k: 'enemy', id: 'root_biter', at: { x: 5, y: 5 } }]),
};

function state(visited: ScreenId[] = []) {
  const s = newGame(1, TEST_START);
  s.world.visited = visited;
  return s;
}

describe('dungeon map', () => {
  it('shows only the rooms walked through, and where Ask is', () => {
    const m = dungeonMap(LAYOUT, SCREENS, DB.enemies, state(['test_c']), 'd1', 'test_c');
    expect(m).toMatchObject({ dungeon: 'd1', cols: 2, rows: 2, map: false, compass: false, keys: 0 });
    expect(m?.cells.filter((c) => c.shown).map((c) => c.id)).toEqual(['test_c']);
    expect(m?.cells.find((c) => c.here)?.id).toBe('test_c');
    expect(m?.cells.some((c) => c.boss || c.chest)).toBe(false);
  });

  it('shows every room once the map is found', () => {
    const s = state(['test_c']);
    s.dungeons.d1 = { keys: 2, bigKey: false, map: true, compass: false, bossDead: false, doors: [] };
    const m = dungeonMap(LAYOUT, SCREENS, DB.enemies, s, 'd1', 'test_c');
    expect(m?.cells.filter((c) => c.shown)).toHaveLength(4);
    expect(m?.cells.find((c) => c.id === 'test_b')?.visited).toBe(false);
    expect(m?.keys).toBe(2);
  });

  it('marks the lair and the unopened chests with the compass', () => {
    const s = state(['test_c']);
    s.dungeons.d1 = { keys: 0, bigKey: false, map: false, compass: true, bossDead: false, doors: [] };
    s.world.opened = ['c1'];
    const m = dungeonMap(LAYOUT, SCREENS, DB.enemies, s, 'd1', 'test_c');
    expect(m?.cells.filter((c) => c.boss).map((c) => c.id)).toEqual(['test_a']);
    expect(m?.cells.filter((c) => c.chest).map((c) => c.id)).toEqual(['test_b']);
    s.world.opened.push('c2');
    s.dungeons.d1.bossDead = true;
    const after = dungeonMap(LAYOUT, SCREENS, DB.enemies, s, 'd1', 'test_c');
    expect(after?.cells.some((c) => c.boss || c.chest)).toBe(false);
  });

  it('never writes to the save', () => {
    const s = state();
    const all: Partial<Record<DungeonId, unknown>> = s.dungeons;
    delete all.d1;
    dungeonMap(LAYOUT, SCREENS, DB.enemies, s, 'd1', 'test_c');
    expect('d1' in s.dungeons).toBe(false);
  });

  it('is null for a dungeon without a floor', () => {
    expect(dungeonMap(LAYOUT, SCREENS, DB.enemies, state(), 'd2', 'test_c')).toBeNull();
  });
});
