import { describe, expect, it } from 'vitest';
import { CLOUD_SIZE, cloudShadows } from '@art/clouds';
import { alphaAt, rastersEqual } from '@art/raster';

describe('cloud shadows', () => {
  const r = cloudShadows(7);

  it('is a square of the declared size, dark and translucent', () => {
    expect(r.w).toBe(CLOUD_SIZE);
    expect(r.h).toBe(CLOUD_SIZE);
    let max = 0;
    let sum = 0;
    for (let i = 3; i < r.data.length; i += 4) {
      const a = r.data[i] ?? 0;
      max = Math.max(max, a);
      sum += a;
    }
    expect(max).toBeGreaterThan(60);
    expect(max).toBeLessThan(160);
    expect(sum / (r.w * r.h)).toBeGreaterThan(4);
    expect(sum / (r.w * r.h)).toBeLessThan(80);
  });

  it('tiles seamlessly: opposite edges differ little', () => {
    let jump = 0;
    for (let y = 0; y < r.h; y++) jump = Math.max(jump, Math.abs(alphaAt(r, 0, y) - alphaAt(r, r.w - 1, y)));
    for (let x = 0; x < r.w; x++) jump = Math.max(jump, Math.abs(alphaAt(r, x, 0) - alphaAt(r, x, r.h - 1)));
    expect(jump).toBeLessThan(24);
  });

  it('is smooth: neighbouring pixels differ little', () => {
    let jump = 0;
    for (let y = 0; y < r.h; y++)
      for (let x = 1; x < r.w; x++) jump = Math.max(jump, Math.abs(alphaAt(r, x, y) - alphaAt(r, x - 1, y)));
    expect(jump).toBeLessThan(24);
  });

  it('is deterministic per seed', () => {
    expect(rastersEqual(cloudShadows(7), r)).toBe(true);
    expect(rastersEqual(cloudShadows(8), r)).toBe(false);
  });
});
