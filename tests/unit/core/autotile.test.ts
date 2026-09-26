import { describe, expect, it } from 'vitest';
import { BLOB_MASKS, E, N, NE, S, W, blobIndex, neighbourMask, reduceMask } from '@core/world/autotile';

describe('blob-47', () => {
  it('has exactly 47 distinct reduced masks', () => {
    expect(BLOB_MASKS).toHaveLength(47);
    expect(new Set(BLOB_MASKS).size).toBe(47);
  });

  it('drops diagonals whose two cardinals are not both present', () => {
    expect(reduceMask(NE)).toBe(0);
    expect(reduceMask(N | NE)).toBe(N);
    expect(reduceMask(N | E | NE)).toBe(N | E | NE);
  });

  it('indexes isolated and fully surrounded tiles at the ends', () => {
    expect(blobIndex(0)).toBe(0);
    expect(blobIndex(0xff)).toBe(46);
  });

  it('treats out-of-bounds neighbours as the same terrain', () => {
    const same = (): boolean => false;
    expect(neighbourMask(0, 0, 3, 3, same) & (N | W)).toBe(N | W);
    expect(neighbourMask(1, 1, 3, 3, same)).toBe(0);
    expect(neighbourMask(1, 1, 3, 3, () => true)).toBe(0xff);
    expect(neighbourMask(2, 2, 3, 3, same) & (S | E)).toBe(S | E);
  });
});
