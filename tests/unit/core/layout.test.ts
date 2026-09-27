import { describe, expect, it } from 'vitest';
import { SCREEN_H, SCREEN_W } from '@core/world/dims';
import { indexLayout, neighbourOf, type WorldLayout } from '@core/world/screen';

/** Two overworld screens, one interior, and two dungeons of two rooms each (ids borrowed from content). */
const LAYOUT: WorldLayout = {
  cols: 4,
  rows: 3,
  at: { test_a: [0, 0], test_b: [1, 0] },
  dungeons: {
    d1: { cols: 2, rows: 2, at: { ask_field: [0, 1], ask_brook: [1, 1] } },
    d2: { cols: 1, rows: 2, at: { ask_hof: [0, 0], ask_ridge: [0, 1] } },
  },
};
const IDS = ['test_a', 'test_b', 'test_int', 'ask_field', 'ask_brook', 'ask_hof', 'ask_ridge'] as const;

describe('dungeon grids', () => {
  const index = indexLayout(LAYOUT, IDS);

  it('knows which dungeon a room belongs to', () => {
    expect(index.gridOf('ask_field')).toBe('d1');
    expect(index.gridOf('ask_ridge')).toBe('d2');
    expect(index.gridOf('test_a')).toBeNull();
    expect(index.gridOf('test_int')).toBeNull();
  });

  it('slides between rooms of one grid, never across grids or into the overworld', () => {
    expect(neighbourOf(index, 'ask_field', 'e')).toBe('ask_brook');
    expect(neighbourOf(index, 'ask_brook', 'w')).toBe('ask_field');
    expect(neighbourOf(index, 'ask_hof', 's')).toBe('ask_ridge');
    expect(neighbourOf(index, 'ask_field', 'n')).toBeNull();
    expect(neighbourOf(index, 'test_a', 'e')).toBe('test_b');
    expect(neighbourOf(index, 'test_a', 's')).toBeNull();
  });

  it('gives every screen its own place in the world, below the overworld and the pockets', () => {
    const origins = IDS.map((id) => index.origin(id));
    const keys = new Set(origins.map((o) => `${o.x},${o.y}`));
    expect(keys.size).toBe(IDS.length);
    expect(index.origin('test_int').y).toBe(4 * SCREEN_H);
    expect(index.origin('ask_field')).toEqual({ x: 0, y: (6 + 1) * SCREEN_H });
    expect(index.origin('ask_brook')).toEqual({ x: SCREEN_W, y: 7 * SCREEN_H });
    expect(index.origin('ask_hof').y).toBeGreaterThan(index.origin('ask_field').y);
  });

  it('rejects a screen on two grids', () => {
    expect(() =>
      indexLayout({ ...LAYOUT, dungeons: { d1: { cols: 1, rows: 1, at: { test_a: [0, 0] } } } }, IDS),
    ).toThrow(/two grids/);
  });
});
