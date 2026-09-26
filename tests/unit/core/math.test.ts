import { describe, expect, it } from 'vitest';
import { at, overlaps, translate } from '@core/math/box';
import { DIR_VEC, dirFromVec, opposite } from '@core/math/dir';
import { fnv1a, hashInts, hex8, unitFromHash } from '@core/math/hash';
import { createRng, nextFloat, nextInt, nextU32 } from '@core/math/rng';
import { length, lerp, normalize, vec } from '@core/math/vec';

describe('rng', () => {
  it('is deterministic for a seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = [nextU32(a), nextU32(a), nextU32(a)];
    const seqB = [nextU32(b), nextU32(b), nextU32(b)];
    expect(seqA).toEqual(seqB);
  });

  it('differs between seeds', () => {
    expect(nextU32(createRng(1))).not.toBe(nextU32(createRng(2)));
  });

  it('survives a JSON round trip mid-sequence', () => {
    const a = createRng(9);
    nextU32(a);
    const b = JSON.parse(JSON.stringify(a)) as typeof a;
    expect(nextU32(b)).toBe(nextU32(a));
  });

  it('keeps floats in [0, 1) and ints in range', () => {
    const r = createRng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 10_000; i++) {
      const f = nextFloat(r);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
      const n = nextInt(r, 3, 6);
      expect([3, 4, 5]).toContain(n);
      seen.add(n);
    }
    expect(seen.size).toBe(3);
  });
});

describe('hash', () => {
  it('matches known FNV-1a values', () => {
    expect(fnv1a('')).toBe(0x811c9dc5);
    expect(fnv1a('a')).toBe(0xe40c292c);
  });

  it('hashes integer lists order-sensitively', () => {
    expect(hashInts(1, 2)).not.toBe(hashInts(2, 1));
    expect(hashInts(1, 2)).toBe(hashInts(1, 2));
  });

  it('maps hashes into [0, 1)', () => {
    expect(unitFromHash(0)).toBe(0);
    expect(unitFromHash(0xffffffff)).toBeLessThan(1);
  });

  it('formats hex8', () => {
    expect(hex8(255)).toBe('000000ff');
    expect(hex8(0xe40c292c)).toBe('e40c292c');
  });
});

describe('vec', () => {
  it('normalizes and keeps zero at zero', () => {
    expect(length(normalize(vec(3, 4)))).toBeCloseTo(1);
    expect(normalize(vec(0, 0))).toEqual({ x: 0, y: 0 });
  });

  it('lerps', () => {
    expect(lerp(vec(0, 0), vec(10, 20), 0.5)).toEqual({ x: 5, y: 10 });
  });
});

describe('box', () => {
  it('treats touching edges as not overlapping', () => {
    expect(overlaps({ x: 0, y: 0, w: 16, h: 16 }, { x: 16, y: 0, w: 16, h: 16 })).toBe(false);
    expect(overlaps({ x: 0, y: 0, w: 16, h: 16 }, { x: 15, y: 15, w: 4, h: 4 })).toBe(true);
  });

  it('anchors a relative box at a point', () => {
    expect(at({ x: -6, y: -8, w: 12, h: 8 }, vec(100, 50))).toEqual({ x: 94, y: 42, w: 12, h: 8 });
    expect(translate({ x: 1, y: 2, w: 3, h: 4 }, 10, 20)).toEqual({ x: 11, y: 22, w: 3, h: 4 });
  });
});

describe('dir', () => {
  it('knows opposites and vectors', () => {
    expect(opposite('n')).toBe('s');
    expect(opposite('e')).toBe('w');
    expect(DIR_VEC.e).toEqual({ x: 1, y: 0 });
  });

  it('faces the dominant axis', () => {
    expect(dirFromVec(vec(1, 0), 'n')).toBe('e');
    expect(dirFromVec(vec(0, -1), 'e')).toBe('n');
    expect(dirFromVec(vec(0.9, 0.2), 's')).toBe('e');
  });

  it('keeps a compatible facing on diagonals (Zelda-style)', () => {
    expect(dirFromVec(vec(1, 1), 's')).toBe('s');
    expect(dirFromVec(vec(1, 1), 'e')).toBe('e');
    expect(dirFromVec(vec(1, 1), 'n')).toBe('e');
  });

  it('keeps the current facing for no movement', () => {
    expect(dirFromVec(vec(0, 0), 'w')).toBe('w');
  });
});
