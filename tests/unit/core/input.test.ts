import { describe, expect, it } from 'vitest';
import {
  InputLatch,
  bit,
  bitsOf,
  isHeld,
  moveVector,
  quantize,
  straightDir,
  wasPressed,
  wasReleased,
} from '@core/input/actions';
import { length } from '@core/math/vec';

describe('InputLatch', () => {
  it('reports a press once, then only held', () => {
    const latch = new InputLatch();
    latch.report(bit('sword'), 0, 0);
    const a = latch.consume();
    const b = latch.consume();
    expect(wasPressed(a, 'sword')).toBe(true);
    expect(isHeld(a, 'sword')).toBe(true);
    expect(wasPressed(b, 'sword')).toBe(false);
    expect(isHeld(b, 'sword')).toBe(true);
  });

  it('never loses a tap that starts and ends between two ticks', () => {
    const latch = new InputLatch();
    latch.report(bit('roll'), 0, 0);
    latch.report(0, 0, 0);
    const f = latch.consume();
    expect(wasPressed(f, 'roll')).toBe(true);
    expect(isHeld(f, 'roll')).toBe(true);
    expect(wasReleased(f, 'roll')).toBe(true);
    const g = latch.consume();
    expect(isHeld(g, 'roll')).toBe(false);
    expect(wasPressed(g, 'roll')).toBe(false);
  });

  it('reports releases', () => {
    const latch = new InputLatch();
    latch.report(bit('shield'), 0, 0);
    latch.consume();
    latch.report(0, 0, 0);
    expect(wasReleased(latch.consume(), 'shield')).toBe(true);
  });

  it('quantises analog movement to 1/64 steps', () => {
    const latch = new InputLatch();
    latch.report(0, 0.33333, -2);
    const f = latch.consume();
    expect(f.mx).toBe(quantize(0.33333));
    expect(f.mx * 64).toBe(Math.round(f.mx * 64));
    expect(f.my).toBe(-1);
  });
});

describe('quantize', () => {
  it('treats non-finite input as zero instead of propagating NaN into replays', () => {
    expect(quantize(NaN)).toBe(0);
    expect(quantize(Infinity)).toBe(0);
    expect(quantize(-Infinity)).toBe(0);
  });
});

describe('moveVector', () => {
  it('clamps diagonals to length 1', () => {
    const v = moveVector({ held: bitsOf(['right', 'down']), pressed: 0, released: 0, mx: 1, my: 1 });
    expect(length(v)).toBeCloseTo(1);
  });

  it('keeps gentle analog input below 1', () => {
    const v = moveVector({ held: 0, pressed: 0, released: 0, mx: 0.5, my: 0 });
    expect(v).toEqual({ x: 0.5, y: 0 });
  });
});

describe('straightDir', () => {
  const f = (mx: number, my: number) => ({ held: 0, pressed: 0, released: 0, mx, my });

  it('reads a straight key press as its direction', () => {
    expect(straightDir(f(-1, 0))).toBe('w');
    expect(straightDir(f(0, 1))).toBe('s');
  });

  it('reads a stick leaning close to one axis as that direction', () => {
    expect(straightDir(f(-0.95, 0.12))).toBe('w');
    expect(straightDir(f(0.2, -0.9))).toBe('n');
  });

  it('reads no direction from a diagonal or a resting stick', () => {
    expect(straightDir(f(1, 1))).toBeNull();
    expect(straightDir(f(0.7, -0.5))).toBeNull();
    expect(straightDir(f(0, 0))).toBeNull();
  });
});
