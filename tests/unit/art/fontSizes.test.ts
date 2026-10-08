import { describe, expect, it } from 'vitest';
import {
  FONT_CHARSET,
  FONT_HEIGHT,
  FONT_SIZES,
  fontHeight,
  glyphMap,
  glyphMapAt,
  glyphsAt,
  layoutText,
  lineHeight,
  textWidth,
} from '@art/font';
import { alphaAt } from '@art/raster';

describe('font sizes', () => {
  it('draws the font at 1×, 1.5× and 2×', () => {
    expect(FONT_SIZES).toEqual(['normal', 'large', 'larger']);
    expect([fontHeight('normal'), fontHeight('large'), fontHeight('larger')]).toEqual([FONT_HEIGHT, 17, 22]);
    expect([lineHeight('normal'), lineHeight('large'), lineHeight('larger')]).toEqual([12, 18, 24]);
    for (const size of FONT_SIZES) {
      expect(glyphsAt(size)).toHaveLength(FONT_CHARSET.length);
      for (const g of glyphsAt(size)) expect(g.raster.h).toBe(fontHeight(size));
    }
  });

  it('keeps the normal size exactly as before', () => {
    expect(glyphMapAt('normal')).toBe(glyphMap());
    expect(textWidth('Hrímfjöll', 'normal')).toBe(textWidth('Hrímfjöll'));
  });

  it('scales each glyph pixel by pixel, so no ink is lost or blurred', () => {
    const a = glyphMap().get('A')?.raster;
    const big = glyphMapAt('larger').get('A')?.raster;
    const mid = glyphMapAt('large').get('A')?.raster;
    if (a === undefined || big === undefined || mid === undefined) throw new Error('missing');
    expect(big.w).toBe(a.w * 2);
    expect(mid.w).toBe(Math.ceil(a.w * 1.5));
    for (let y = 0; y < big.h; y++)
      for (let x = 0; x < big.w; x++)
        expect(alphaAt(big, x, y)).toBe(alphaAt(a, Math.floor(x / 2), Math.floor(y / 2)));
    // Every alpha is 0 or 255: nearest neighbour, never a blend.
    for (let i = 3; i < mid.data.length; i += 4) expect([0, 255]).toContain(mid.data[i]);
    // A one-pixel stem stays at least one pixel wide.
    const i = glyphMapAt('large').get('i')?.raster;
    expect(i?.w).toBe(2);
  });

  it('measures and wraps text at each size', () => {
    const s = 'The night was long, and the snow lay deep on Askdalr.';
    expect(textWidth(s, 'large')).toBeGreaterThan(textWidth(s));
    expect(textWidth(s, 'larger')).toBeGreaterThan(textWidth(s, 'large'));
    const w = 200;
    for (const size of FONT_SIZES)
      for (const line of layoutText(s, w, size)) expect(textWidth(line, size)).toBeLessThanOrEqual(w);
    expect(layoutText(s, w, 'larger').length).toBeGreaterThan(layoutText(s, w).length);
  });
});
