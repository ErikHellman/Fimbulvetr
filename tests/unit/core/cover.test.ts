import { describe, expect, it } from 'vitest';
import type { CoverId } from '@content/ids';
import { buildCover, coverAt, cutBox, decodeBits, encodeBits, type CoverDef } from '@core/world/cover';

const ORDER: readonly CoverId[] = ['tall_grass'];
const DEFS: Record<CoverId, CoverDef> = {
  tall_grass: { id: 'tall_grass', seasons: ['summer'], slow: 0.6 },
  leaves: { id: 'leaves', seasons: ['autumn'], slow: 0.8, hides: true, blown: true },
};
const LEGEND = { '"': 'tall_grass' } as const;
const MAP = ['..""', '""..'];

describe('cover', () => {
  it('grows from the map in its seasons only', () => {
    const g = buildCover(MAP, LEGEND, ORDER, DEFS, 'summer', 0, undefined);
    expect(coverAt(g, ORDER, 2, 0)).toBe('tall_grass');
    expect(coverAt(g, ORDER, 0, 0)).toBeNull();
    expect(coverAt(g, ORDER, 9, 9)).toBeNull();
    const winter = buildCover(MAP, LEGEND, ORDER, DEFS, 'winter', 0, undefined);
    expect(coverAt(winter, ORDER, 2, 0)).toBeNull();
  });

  it('is cut by boxes, once', () => {
    const g = buildCover(MAP, LEGEND, ORDER, DEFS, 'summer', 0, undefined);
    expect(cutBox(g, { x: 30, y: 2, w: 20, h: 10 })).toEqual([2, 3]);
    expect(cutBox(g, { x: 30, y: 2, w: 20, h: 4 })).toEqual([]);
    expect(coverAt(g, ORDER, 2, 0)).toBeNull();
  });

  it('keeps cut tiles through a save until the season epoch changes', () => {
    const g = buildCover(MAP, LEGEND, ORDER, DEFS, 'summer', 3, undefined);
    cutBox(g, { x: 0, y: 16, w: 16, h: 16 });
    const save = { epoch: 3, cleared: encodeBits(g.cleared) };
    expect(coverAt(buildCover(MAP, LEGEND, ORDER, DEFS, 'summer', 3, save), ORDER, 0, 1)).toBeNull();
    expect(coverAt(buildCover(MAP, LEGEND, ORDER, DEFS, 'summer', 4, save), ORDER, 0, 1)).toBe('tall_grass');
  });

  it('round-trips bits and tolerates damaged strings', () => {
    const bits = new Uint8Array([1, 0, 0, 1, 0, 0, 0, 0, 1]);
    expect(decodeBits(encodeBits(bits), 9)).toEqual(bits);
    expect(encodeBits(new Uint8Array(8))).toBe('');
    expect(decodeBits('z1ffffffff', 6)).toEqual(new Uint8Array([0, 0, 0, 0, 1, 0]));
  });
});
