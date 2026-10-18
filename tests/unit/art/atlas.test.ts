import { describe, expect, it } from 'vitest';
import { overrideOrigin, parseArtManifest, sheetCell, sheetCells } from '@art/atlas';

describe('art manifest', () => {
  it('parses atlases and tile sheets', () => {
    const m = parseArtManifest({
      version: 1,
      atlases: [{ key: 'hero', image: 'hero.png', data: 'hero.json' }],
      tiles: [{ terrain: 'grass', image: 'grass.png' }],
    });
    expect(m.atlases).toEqual([{ key: 'hero', image: 'hero.png', data: 'hero.json' }]);
    expect(m.tiles).toEqual([{ terrain: 'grass', image: 'grass.png' }]);
  });

  it('accepts an empty manifest with either list missing', () => {
    expect(parseArtManifest({ version: 1 })).toEqual({ atlases: [], tiles: [] });
  });

  it('rejects the wrong version, a bad shape, an unknown terrain and a path that leaves the folder', () => {
    expect(() => parseArtManifest({ version: 2 })).toThrow(/version/);
    expect(() => parseArtManifest(null)).toThrow(/object/);
    expect(() => parseArtManifest({ version: 1, atlases: [{ key: 'a', image: 'a.png' }] })).toThrow(/data/);
    expect(() => parseArtManifest({ version: 1, tiles: [{ terrain: 'nope', image: 'l.png' }] })).toThrow(
      /nope/,
    );
    expect(() => parseArtManifest({ version: 1, tiles: [{ terrain: 'grass', image: '../x.png' }] })).toThrow(
      /path/,
    );
    expect(() =>
      parseArtManifest({ version: 1, atlases: [{ key: 'a', image: 'a.png', data: '/etc/a.json' }] }),
    ).toThrow(/path/);
  });
});

describe('overrideOrigin', () => {
  it('uses the atlas pivot when the frame has one', () => {
    expect(overrideOrigin({ w: 32, h: 32, ox: 0.5, oy: 1 }, { w: 48, h: 40 }, { ox: 0.25, oy: 0.9 })).toEqual(
      {
        ox: 0.25,
        oy: 0.9,
      },
    );
  });

  it('keeps the placeholder feet point when a bigger frame has no pivot: centred, bottom-aligned', () => {
    // Placeholder 32×32 with its feet at (16, 30). A 48×40 frame grows 8 px each side and 8 px upward.
    const o = overrideOrigin({ w: 32, h: 32, ox: 0.5, oy: 30 / 32 }, { w: 48, h: 40 });
    expect(o.ox * 48).toBeCloseTo(24);
    expect(o.oy * 40).toBeCloseTo(38);
  });

  it('is the identity for a same-size frame without a pivot', () => {
    expect(overrideOrigin({ w: 20, h: 10, ox: 0.3, oy: 0.8 }, { w: 20, h: 10 })).toEqual({
      ox: 0.3,
      oy: 0.8,
    });
  });
});

describe('tile sheets', () => {
  it('reads cells left to right, then down, as many per row as fit', () => {
    expect(sheetCell(0, 160)).toEqual({ x: 0, y: 0 });
    expect(sheetCell(9, 160)).toEqual({ x: 144, y: 0 });
    expect(sheetCell(10, 160)).toEqual({ x: 0, y: 16 });
    expect(sheetCell(3, 16)).toEqual({ x: 0, y: 48 });
  });

  it('counts only whole cells', () => {
    expect(sheetCells(160, 80)).toBe(50);
    expect(sheetCells(170, 20)).toBe(10);
    expect(sheetCells(8, 16)).toBe(0);
  });
});
