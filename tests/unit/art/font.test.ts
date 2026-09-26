import { describe, expect, it } from 'vitest';
import { FONT_CHARSET, FONT_HEIGHT, glyphMap, glyphs, layoutText, textWidth, unknownChars } from '@art/font';
import { alphaAt } from '@art/raster';

describe('font', () => {
  it('draws every character of its charset at the cell height', () => {
    const map = glyphMap();
    for (const ch of FONT_CHARSET) {
      const g = map.get(ch);
      expect(g, `glyph '${ch}'`).toBeDefined();
      expect(g?.raster.h).toBe(FONT_HEIGHT);
      expect(g?.advance).toBeGreaterThan(0);
    }
    expect(glyphs()).toHaveLength(FONT_CHARSET.length);
  });

  it('covers Swedish and Old Norse letters', () => {
    expect(
      unknownChars('Gyða, Þorkell, Ása, Tófa, Sævatn, Hrímfjöll, Önundr, Dagný, Útgarðr, åäö ÅÄÖ ǫ'),
    ).toEqual([]);
    expect(unknownChars('日本')).toEqual(['日', '本']);
  });

  it('puts accents above the letter, not on it', () => {
    const plain = glyphMap().get('A')?.raster;
    const ring = glyphMap().get('Å')?.raster;
    if (plain === undefined || ring === undefined) throw new Error('missing');
    let topInk = 0;
    for (let x = 0; x < ring.w; x++) topInk += alphaAt(ring, x, 0) + alphaAt(ring, x, 1);
    expect(topInk).toBeGreaterThan(0);
    for (let x = 0; x < plain.w; x++) expect(alphaAt(plain, x, 0)).toBe(0);
  });

  it('measures and wraps text', () => {
    expect(textWidth('')).toBe(0);
    expect(textWidth('ii')).toBe(3);
    const lines = layoutText('the quick brown fox jumps over the lazy dog', 60);
    expect(lines.length).toBeGreaterThan(2);
    for (const l of lines) expect(textWidth(l)).toBeLessThanOrEqual(60);
    expect(lines.join(' ')).toBe('the quick brown fox jumps over the lazy dog');
    expect(layoutText('a\nb', 100)).toEqual(['a', 'b']);
  });
});
