import { describe, expect, it } from 'vitest';
import { cel, relight } from '@art/cel';
import { rect } from '@art/draw';
import { C } from '@art/palette';
import { createRaster, getPixel, hex } from '@art/raster';

describe('cel relight', () => {
  it('lights the top and left edge of a shape and shades the bottom and right', () => {
    const r = createRaster(8, 8);
    rect(r, 2, 2, 4, 4, [100, 100, 100, 255]);
    const out = relight(r);
    expect(getPixel(out, 2, 2)[0]).toBeGreaterThan(100);
    expect(getPixel(out, 4, 2)[0]).toBeGreaterThan(100);
    expect(getPixel(out, 2, 4)[0]).toBeGreaterThan(100);
    expect(getPixel(out, 5, 5)[0]).toBeLessThan(100);
    expect(getPixel(out, 4, 5)[0]).toBeLessThan(100);
    expect(getPixel(out, 3, 3)).toEqual([100, 100, 100, 255]);
    expect(getPixel(out, 0, 0)[3]).toBe(0);
  });

  it('leaves ink alone and keeps alpha', () => {
    const r = createRaster(6, 6);
    rect(r, 1, 1, 3, 3, hex(C.ink));
    rect(r, 1, 4, 3, 1, [200, 100, 50, 128]);
    const out = relight(r);
    expect(getPixel(out, 1, 1)).toEqual(hex(C.ink));
    expect(getPixel(out, 1, 4)[3]).toBe(128);
  });

  it('cel adds the outline around the relit shape', () => {
    const r = createRaster(8, 8);
    rect(r, 3, 3, 2, 2, [100, 100, 100, 255]);
    const out = cel(r, 1);
    expect(getPixel(out, 2, 3)).toEqual(hex(C.ink));
    expect(getPixel(out, 3, 3)[0]).toBeGreaterThan(100);
  });
});
