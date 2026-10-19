import { describe, expect, it } from 'vitest';
import { bit } from '@core/input/actions';
import { moveStick, startStick, stickAxes, stickBits } from '@shell/input/stick';

describe('touch stick', () => {
  it('is centred where the thumb lands', () => {
    expect(stickAxes(startStick(100, 200), 40)).toEqual([0, 0]);
  });

  it('gives full deflection at the radius and ignores the dead zone', () => {
    const s = moveStick(startStick(100, 200), 140, 200, 40);
    expect(stickAxes(s, 40)).toEqual([1, 0]);
    expect(stickAxes(moveStick(startStick(0, 0), 0, 5, 40), 40)).toEqual([0, 0]);
  });

  it('drags its centre along when the thumb goes past the radius', () => {
    const s = moveStick(startStick(0, 0), 0, 100, 40);
    expect(s.oy).toBeCloseTo(60);
    expect(stickAxes(s, 40)[1]).toBeCloseTo(1);
    // Coming back now moves the stick up from the new centre at once.
    expect(stickAxes(moveStick(s, 0, 40, 40), 40)[1]).toBeLessThan(0);
  });

  it('presses the d-pad actions past half way, two of them on a diagonal', () => {
    expect(stickBits(0.3, 0)).toBe(0);
    expect(stickBits(0.9, 0)).toBe(bit('right'));
    expect(stickBits(0, -0.9)).toBe(bit('up'));
    expect(stickBits(-0.7, 0.7)).toBe(bit('left') | bit('down'));
  });
});
