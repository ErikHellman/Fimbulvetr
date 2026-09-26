import { describe, expect, it } from 'vitest';
import { computeZoom } from '@shell/scale';

describe('computeZoom', () => {
  it('picks the largest whole multiple that fits', () => {
    expect(computeZoom(1920, 1080, 1, 'integer')).toBe(3);
    expect(computeZoom(1500, 900, 1, 'integer')).toBe(2);
  });

  it('counts device pixels so high-DPI and 125 % scaling stay crisp', () => {
    expect(computeZoom(1440, 900, 2, 'integer')).toBe(2);
    expect(computeZoom(1536, 864, 1.25, 'integer')).toBeCloseTo(2.4);
  });

  it('never returns zero for a tiny window; it shrinks to fit instead', () => {
    const z = computeZoom(600, 300, 1, 'integer');
    expect(z).toBeGreaterThan(0);
    expect(z).toBeCloseTo(300 / 360);
  });

  it('fills the window in fit mode', () => {
    expect(computeZoom(1500, 900, 1, 'fit')).toBeCloseTo(1500 / 640);
  });
});
