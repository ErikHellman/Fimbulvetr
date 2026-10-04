import { describe, expect, it } from 'vitest';
import type { CoverId } from '@content/ids';
import type { TerrainId } from '@content/terrain';
import { buildCover, coverAt, cutBox, decodeBits, encodeBits, type CoverDef } from '@core/world/cover';

const ORDER: readonly CoverId[] = ['tall_grass'];
const DEFS: Record<CoverId, CoverDef> = {
  tall_grass: { id: 'tall_grass', seasons: ['summer'], slow: 0.6 },
  leaves: { id: 'leaves', seasons: ['autumn'], slow: 0.8, hides: true, blown: true },
  snow: { id: 'snow', seasons: ['winter'], slow: 0.7, grows: { on: ['grass', 'path'] } },
  drift: { id: 'drift', seasons: ['winter'], slow: 0.5, cut: false },
  mud: { id: 'mud', seasons: ['spring'], slow: 0.75, grows: { on: ['grass'], by: ['water'] }, wet: true },
  ice: { id: 'ice', seasons: ['winter'], slow: 1, grows: { on: ['water'] }, walk: true },
  flood: { id: 'flood', seasons: ['spring'], slow: 1, grows: { on: ['shoal'] }, sink: true },
  is_ice: { id: 'is_ice', seasons: ['summer'], slow: 1, walk: true },
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

describe('derived cover', () => {
  const ALL: readonly CoverId[] = ['tall_grass', 'leaves', 'snow', 'drift', 'mud', 'ice'];
  const LEG = { '"': 'tall_grass', '^': 'drift' } as const;
  // Row 0: grass, tall grass, drift, path, rock. Row 1: grass, grass, grass, water, water.
  const map = ['."^,#', '...~~'];
  const cells: TerrainId[] = [
    'grass',
    'grass',
    'grass',
    'path',
    'rock',
    'grass',
    'grass',
    'grass',
    'water',
    'water',
  ];
  const terrain = { cols: 5, rows: 2, cells };
  const at = (g: ReturnType<typeof buildCover>, x: number, y: number) => coverAt(g, ALL, x, y);

  it('lays snow over open ground and ice on water in winter, drifts where the map draws them', () => {
    const g = buildCover(map, LEG, ALL, DEFS, 'winter', 0, undefined, { terrain, outdoor: true, wet: false });
    expect([0, 1, 2, 3, 4].map((x) => at(g, x, 0))).toEqual(['snow', 'snow', 'drift', 'snow', null]);
    expect([0, 1, 2, 3, 4].map((x) => at(g, x, 1))).toEqual(['snow', 'snow', 'snow', 'ice', 'ice']);
  });

  it("keeps the map's own cover first in its season", () => {
    const g = buildCover(map, LEG, ALL, DEFS, 'summer', 0, undefined, { terrain, outdoor: true, wet: true });
    expect(at(g, 1, 0)).toBe('tall_grass');
    expect(at(g, 0, 0)).toBeNull();
    expect(at(g, 3, 1)).toBeNull();
  });

  it('gathers mud beside water only on wet spring days', () => {
    const wet = buildCover(map, LEG, ALL, DEFS, 'spring', 0, undefined, {
      terrain,
      outdoor: true,
      wet: true,
    });
    expect([0, 1, 2].map((x) => at(wet, x, 1))).toEqual([null, null, 'mud']);
    expect(at(wet, 2, 0)).toBe('mud');
    expect(wet.wet).toBe(true);
    const dry = buildCover(map, LEG, ALL, DEFS, 'spring', 0, undefined, {
      terrain,
      outdoor: true,
      wet: false,
    });
    expect(at(dry, 2, 1)).toBeNull();
  });

  it('floods a shoal in spring only, and never freezes rapids or springs', () => {
    const all: readonly CoverId[] = [...ALL, 'flood'];
    // Shoal, rapids, spring, water.
    const t = { cols: 4, rows: 1, cells: ['shoal', 'rapids', 'spring', 'water'] as TerrainId[] };
    const build = (season: 'spring' | 'winter' | 'summer') =>
      buildCover(['evs~'], LEG, all, DEFS, season, 0, undefined, { terrain: t, outdoor: true, wet: false });
    const row = (g: ReturnType<typeof buildCover>) => [0, 1, 2, 3].map((x) => coverAt(g, all, x, 0));
    expect(row(build('spring'))).toEqual(['flood', null, null, null]);
    expect(row(build('winter'))).toEqual([null, null, null, 'ice']);
    expect(row(build('summer'))).toEqual([null, null, null, null]);
  });

  it('grows nothing by itself under a roof', () => {
    const g = buildCover(map, LEG, ALL, DEFS, 'winter', 0, undefined, {
      terrain,
      outdoor: false,
      wet: false,
    });
    expect(at(g, 0, 0)).toBeNull();
    expect(at(g, 2, 0)).toBe('drift');
  });
});
