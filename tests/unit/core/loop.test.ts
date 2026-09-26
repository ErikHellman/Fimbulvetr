import { describe, expect, it } from 'vitest';
import { MAX_STEPS, STEP_MS, advance } from '@core/sim/loop';

describe('advance', () => {
  it('runs one step per 60 Hz frame', () => {
    expect(advance({ acc: 0 }, STEP_MS).steps).toBe(1);
  });

  it('accumulates short frames (120 Hz display)', () => {
    const a = { acc: 0 };
    const first = advance(a, STEP_MS / 2);
    expect(first.steps).toBe(0);
    expect(first.alpha).toBeCloseTo(0.5);
    expect(advance(a, STEP_MS / 2).steps).toBe(1);
  });

  it('caps a huge hitch (tab was in the background) and drops the rest', () => {
    const a = { acc: 0 };
    const r = advance(a, 60_000);
    expect(r.steps).toBe(MAX_STEPS);
    expect(r.alpha).toBe(0);
    expect(a.acc).toBe(0);
  });

  it('ignores negative and non-finite deltas', () => {
    const a = { acc: 0 };
    expect(advance(a, -50).steps).toBe(0);
    expect(advance(a, Number.NaN).steps).toBe(0);
    expect(a.acc).toBe(0);
  });

  it('keeps alpha in [0, 1)', () => {
    const a = { acc: 0 };
    for (const d of [3, 17, 16.6, 40, 1, 33.3, 8]) {
      const { alpha } = advance(a, d);
      expect(alpha).toBeGreaterThanOrEqual(0);
      expect(alpha).toBeLessThan(1);
    }
  });
});
