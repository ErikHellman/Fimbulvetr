import { describe, expect, it } from 'vitest';
import { decodeGrid } from '@art/grid';
import { outline } from '@art/outline';
import { countOpaque, createRaster, extrude, flipX, getPixel, hex, setPixel } from '@art/raster';

describe('raster', () => {
  it('parses hex colours', () => {
    expect(hex('#ff8000')).toEqual([255, 128, 0, 255]);
    expect(() => hex('red')).toThrow("bad colour 'red'");
  });

  it('ignores writes outside the raster', () => {
    const r = createRaster(2, 2);
    setPixel(r, 5, 5, [1, 2, 3, 255]);
    setPixel(r, 1, 0, [1, 2, 3, 255]);
    expect(countOpaque(r)).toBe(1);
    expect(getPixel(r, -1, 0)).toEqual([0, 0, 0, 0]);
  });

  it('mirrors horizontally', () => {
    const r = createRaster(3, 1);
    setPixel(r, 0, 0, [9, 9, 9, 255]);
    expect(getPixel(flipX(r), 2, 0)).toEqual([9, 9, 9, 255]);
  });

  it('extrudes edge pixels outward', () => {
    const r = createRaster(2, 2);
    setPixel(r, 0, 0, [5, 5, 5, 255]);
    const e = extrude(r, 1);
    expect([e.w, e.h]).toEqual([4, 4]);
    expect(getPixel(e, 0, 0)).toEqual([5, 5, 5, 255]);
    expect(getPixel(e, 1, 1)).toEqual([5, 5, 5, 255]);
  });
});

describe('grids', () => {
  it('decodes palette-indexed rows', () => {
    const r = decodeGrid(['.a', 'a.'], { '.': null, a: '#010203' });
    expect(getPixel(r, 1, 0)).toEqual([1, 2, 3, 255]);
    expect(getPixel(r, 0, 0)[3]).toBe(0);
  });

  it('reports ragged rows and unknown colours', () => {
    expect(() => decodeGrid(['..', '.'], { '.': null })).toThrow('grid row 1: expected width 2, got 1');
    expect(() => decodeGrid(['.x'], { '.': null })).toThrow("grid row 0, col 1: unknown colour 'x'");
  });
});

describe('outline', () => {
  it('adds a 1 px ring (4-neighbour)', () => {
    const r = createRaster(5, 5);
    setPixel(r, 2, 2, [255, 255, 255, 255]);
    expect(countOpaque(outline(r, [0, 0, 0, 255], 1))).toBe(5);
  });

  it('adds a 2 px ring as a diamond', () => {
    const r = createRaster(7, 7);
    setPixel(r, 3, 3, [255, 255, 255, 255]);
    expect(countOpaque(outline(r, [0, 0, 0, 255], 2))).toBe(13);
  });
});
