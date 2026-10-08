import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { room } from '@content/world/utgard/templates';
import { parseTextMap } from '@core/world/textmap';

const terrain = (map: readonly string[], x: number, y: number): string | undefined => {
  const g = parseTextMap(map, DB.legend);
  return g.cells[y * g.cols + x];
};

describe('Útgarðr’s room templates', () => {
  it('builds a 40×22 hall of giant stone, walls two thick, with a doorway on each named side', () => {
    const map = room('nw').done();
    expect(map).toHaveLength(22);
    for (const row of map) expect(row).toHaveLength(40);
    expect(terrain(map, 1, 5)).toBe('giant_wall');
    expect(terrain(map, 5, 5)).toBe('giant_floor');
    // North and west open; south and east shut.
    for (const [x, y] of [
      [19, 0],
      [20, 1],
      [0, 10],
      [1, 11],
    ] as const)
      expect(terrain(map, x, y), `${String(x)},${String(y)}`).toBe('giant_floor');
    for (const [x, y] of [
      [19, 21],
      [39, 10],
    ] as const)
      expect(terrain(map, x, y), `${String(x)},${String(y)}`).toBe('giant_wall');
  });

  it('sets pillars (2×2), glaze, pits, lava and water where asked', () => {
    const map = room('nsew')
      .pillars({ x: 8, y: 5 })
      .rink(10, 12, 4, 3)
      .pits(20, 4, 2, 2)
      .lava(30, 4, 2, 1)
      .water(30, 16, 3, 2)
      .done();
    expect(terrain(map, 9, 6)).toBe('giant_wall');
    expect(terrain(map, 13, 14)).toBe('glaze');
    expect(terrain(map, 21, 5)).toBe('pit');
    expect(terrain(map, 31, 4)).toBe('lava');
    expect(terrain(map, 32, 17)).toBe('water');
    expect(terrain(map, 10, 6)).toBe('giant_floor');
  });

  it('walls a cell round with its doorway on one side, and an eye niche with clear ice on its face', () => {
    const map = room('s').cell(4, 4, 6, 4, 'e').niche(30, 6, 's').done();
    // The cell's ring of wall, its two-tile doorway in the middle of the east side, and its floor.
    expect(terrain(map, 4, 4)).toBe('giant_wall');
    expect(terrain(map, 9, 5)).toBe('giant_floor');
    expect(terrain(map, 9, 6)).toBe('giant_floor');
    expect(terrain(map, 9, 4)).toBe('giant_wall');
    expect(terrain(map, 6, 5)).toBe('giant_floor');
    // The niche: the eye's tile open, walled on three sides, clear ice to the south.
    expect(terrain(map, 30, 6)).toBe('giant_floor');
    expect(terrain(map, 30, 7)).toBe('clear_ice');
    expect(terrain(map, 29, 6)).toBe('giant_wall');
    expect(terrain(map, 31, 6)).toBe('giant_wall');
    expect(terrain(map, 30, 5)).toBe('giant_wall');
  });

  it('refuses to build past the room’s edge', () => {
    expect(() => room('').pits(38, 20, 4, 4)).toThrow(/outside/);
  });
});
