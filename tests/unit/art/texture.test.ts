import { describe, expect, it } from 'vitest';
import { createPainter } from '@art/painter';
import { getPixel, hex, rastersEqual } from '@art/raster';
import { clods, regionLit, ridges, tufts, type Tones } from '@art/texture';

const TONES: Tones = { base: '#6aa84f', shade: '#4f8a3c', light: '#8cc46a' };
const BLANK = '#000000';

function is(r: ReturnType<typeof createPainter>['r'], x: number, y: number, colour: string): boolean {
  const c = hex(colour);
  const p = getPixel(r, x, y);
  return p[3] > 0 && p[0] === c[0] && p[1] === c[1] && p[2] === c[2];
}

function painted(r: ReturnType<typeof createPainter>['r'], colour: string): number {
  const c = hex(colour);
  let n = 0;
  for (let y = 0; y < r.h; y++)
    for (let x = 0; x < r.w; x++) {
      const p = getPixel(r, x, y);
      if (p[0] === c[0] && p[1] === c[1] && p[2] === c[2]) n++;
    }
  return n;
}

describe('texture helpers', () => {
  it('draws tufts in clusters that cover part of the tile, with light tips and shaded roots', () => {
    const p = createPainter(16, 16, 7);
    p.fill(BLANK);
    tufts(p, TONES, 4);
    const light = painted(p.r, TONES.light);
    const shade = painted(p.r, TONES.shade);
    expect(light + shade).toBeGreaterThan(16);
    expect(light + shade).toBeLessThan(160);
    expect(light).toBeGreaterThan(0);
    expect(shade).toBeGreaterThan(0);
    // Every light tip stands on a shaded root below or below-right: no stray single pixels.
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        if (!is(p.r, x, y, TONES.light)) continue;
        expect(is(p.r, x, y + 1, TONES.shade) || is(p.r, x + 1, y + 1, TONES.shade), `${x},${y}`).toBe(true);
      }
  });

  it('is deterministic for the same seed and differs between seeds', () => {
    const a = createPainter(16, 16, 3);
    const b = createPainter(16, 16, 3);
    const c = createPainter(16, 16, 4);
    for (const p of [a, b, c]) {
      p.fill(TONES.base);
      tufts(p, TONES, 4);
    }
    expect(rastersEqual(a.r, b.r)).toBe(true);
    expect(rastersEqual(a.r, c.r)).toBe(false);
  });

  it('draws clods as small blocks with a light pixel up-left and shade down-right', () => {
    const p = createPainter(16, 16, 11);
    p.fill(BLANK);
    clods(p, TONES, 4, 3);
    expect(painted(p.r, TONES.base)).toBeGreaterThan(8);
    expect(painted(p.r, TONES.light)).toBeGreaterThanOrEqual(4);
    expect(painted(p.r, TONES.shade)).toBeGreaterThanOrEqual(4);
  });

  it('draws ridges as a light row over a shade row', () => {
    const p = createPainter(16, 16, 5);
    p.fill(BLANK);
    ridges(p, TONES, 3, 6);
    const light = painted(p.r, TONES.light);
    expect(light).toBeGreaterThan(6);
    expect(painted(p.r, TONES.shade)).toBe(light);
  });

  it('lights a raised region on its north and west edges and shades the south and east', () => {
    const p = createPainter(16, 16, 1);
    regionLit(p, 0, 2, { ...TONES, relief: 'raised' });
    expect(getPixel(p.r, 8, 2)).toEqual(hex(TONES.light));
    expect(getPixel(p.r, 2, 8)).toEqual(hex(TONES.light));
    expect(getPixel(p.r, 8, 13)).toEqual(hex(TONES.shade));
    expect(getPixel(p.r, 13, 8)).toEqual(hex(TONES.shade));
    expect(getPixel(p.r, 8, 8)).toEqual(hex(TONES.base));
    expect(getPixel(p.r, 0, 0)[3]).toBe(0);
  });

  it('reverses the lighting for a sunken region', () => {
    const p = createPainter(16, 16, 1);
    regionLit(p, 0, 2, { ...TONES, relief: 'sunken' });
    expect(getPixel(p.r, 8, 2)).toEqual(hex(TONES.shade));
    expect(getPixel(p.r, 8, 13)).toEqual(hex(TONES.light));
  });

  it('keeps a fully surrounded region edgeless', () => {
    const p = createPainter(16, 16, 1);
    regionLit(p, 0xff, 2, { ...TONES, relief: 'raised' });
    expect(painted(p.r, TONES.base)).toBe(256);
  });
});
