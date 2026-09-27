import { describe, expect, it } from 'vitest';
import type { TerrainId } from '@content/terrain';
import { LEGEND } from '@content/world/legend';
import { fishJump, openWaterCells } from '@core/world/ambient';
import { parseTextMap, type TerrainGrid } from '@core/world/textmap';

const isWater = (t: TerrainId): boolean => t === 'water' || t === 'ford' || t === 'jetty';
const pond = (n: number): TerrainGrid => ({
  cols: n,
  rows: n,
  cells: Array.from({ length: n * n }, () => 'water'),
});

describe('openWaterCells', () => {
  it('keeps the inner cells of a pond, never its outer ring', () => {
    const cells = openWaterCells(pond(5), isWater);
    expect(cells).toHaveLength(9);
    expect(cells).toContainEqual({ x: 2, y: 2 });
    expect(cells.every((c) => c.x >= 1 && c.x <= 3 && c.y >= 1 && c.y <= 3)).toBe(true);
    expect(openWaterCells(pond(2), isWater)).toEqual([]);
  });

  it('finds the middle of a four-wide brook and treats the ford as water beside it', () => {
    const rows = Array.from({ length: 22 }, (_, y) => {
      const band = y >= 9 && y <= 12 ? 'oooo' : '~~~~';
      return `${'.'.repeat(26)}${band}${'.'.repeat(10)}`;
    });
    const cells = openWaterCells(parseTextMap(rows, LEGEND), isWater);
    expect(cells.every((c) => c.x === 27 || c.x === 28)).toBe(true);
    expect(cells).toContainEqual({ x: 27, y: 8 });
    expect(cells).toContainEqual({ x: 28, y: 13 });
    expect(cells.some((c) => c.y >= 9 && c.y <= 12)).toBe(false);
    expect(cells).toHaveLength(2 * (20 - 4));
  });
});

describe('fishJump', () => {
  it('fires on about one slot in eight, always inside the cell list, and repeats exactly', () => {
    let fired = 0;
    for (let slot = 0; slot < 800; slot++) {
      const a = fishJump(42, slot, 13);
      expect(a).toBe(fishJump(42, slot, 13));
      if (a === null) continue;
      fired++;
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(13);
    }
    expect(fired).toBeGreaterThan(70);
    expect(fired).toBeLessThan(130);
  });

  it('never fires without open water', () => {
    for (let slot = 0; slot < 100; slot++) expect(fishJump(1, slot, 0)).toBeNull();
  });
});
