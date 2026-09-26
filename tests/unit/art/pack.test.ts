import { describe, expect, it } from 'vitest';
import { packShelves } from '@art/pack';

const items = Array.from({ length: 60 }, (_, i) => ({
  name: `f${i}`,
  w: 16 + (i % 3) * 16,
  h: 16 + (i % 4) * 8,
}));

describe('packShelves', () => {
  it('places every item inside a page without overlaps', () => {
    const result = packShelves(items, 256, 1);
    const boxes = items.map((it) => {
      const p = result.placements.get(it.name);
      if (p === undefined) throw new Error(`missing ${it.name}`);
      expect(p.x + it.w).toBeLessThanOrEqual(256);
      expect(p.y + it.h).toBeLessThanOrEqual(result.heights[p.page] ?? 0);
      return { ...p, w: it.w, h: it.h };
    });
    for (const a of boxes) {
      for (const b of boxes) {
        if (a === b || a.page !== b.page) continue;
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        expect(overlap).toBe(false);
      }
    }
  });

  it('opens more pages when needed and is deterministic', () => {
    const a = packShelves(items, 64, 1);
    const b = packShelves(items, 64, 1);
    expect(a.heights.length).toBeGreaterThan(1);
    expect([...a.placements.entries()]).toEqual([...b.placements.entries()]);
  });

  it('rejects an item larger than a page', () => {
    expect(() => packShelves([{ name: 'big', w: 300, h: 10 }], 256)).toThrow(
      "frame 'big' (300×10) does not fit",
    );
  });
});
