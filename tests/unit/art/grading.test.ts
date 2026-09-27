import { describe, expect, it } from 'vitest';
import { IDENTITY, applyMatrix, grade, multiply } from '@art/grading';

const luminance = ([r, g, b]: readonly number[]): number =>
  0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);

describe('colour grading', () => {
  it('multiplies with identity as a neutral element', () => {
    const g = grade('autumn', 1, 'clear');
    expect(multiply(IDENTITY, g)).toEqual(g);
    expect(multiply(g, IDENTITY)).toEqual(g);
  });

  it('produces 20 finite values', () => {
    const g = grade('winter', 0.3, 'fog');
    expect(g).toHaveLength(20);
    expect(g.every(Number.isFinite)).toBe(true);
  });

  it('makes night much darker than day', () => {
    const grey = [128, 128, 128] as const;
    const day = luminance(applyMatrix(grade('summer', 1, 'clear'), grey));
    const night = luminance(applyMatrix(grade('summer', 0, 'clear'), grey));
    expect(night).toBeLessThan(day * 0.6);
  });

  it('darkens a storm more than rain', () => {
    const grey = [128, 128, 128] as const;
    const rain = luminance(applyMatrix(grade('autumn', 0.2, 'rain'), grey));
    const storm = luminance(applyMatrix(grade('autumn', 0.2, 'storm'), grey));
    expect(storm).toBeLessThan(rain);
  });

  it('changes smoothly with light', () => {
    for (let l = 0; l < 1; l += 0.05) {
      const a = grade('spring', l, 'clear');
      const b = grade('spring', l + 0.01, 'clear');
      a.forEach((v, i) => {
        expect(Math.abs(v - (b[i] ?? 0))).toBeLessThan(2);
      });
    }
  });

  it('tints winter bluer than summer', () => {
    const grey = [128, 128, 128] as const;
    const [sr, , sb] = applyMatrix(grade('summer', 1, 'clear'), grey);
    const [wr, , wb] = applyMatrix(grade('winter', 1, 'clear'), grey);
    expect(wb - wr).toBeGreaterThan(sb - sr);
  });
});
