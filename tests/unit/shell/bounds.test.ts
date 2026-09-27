import { describe, expect, it } from 'vitest';
import { bodyBounds, overlaps, overlapsRect } from '@shell/view/bounds';

const hurt = { x: -7, y: -26, w: 14, h: 26 };

describe('bodyBounds', () => {
  it('is the hurt box placed at the drawn feet, not the whole frame', () => {
    expect(bodyBounds(216, 190, 190, hurt)).toEqual({ x: 209, y: 164, w: 14, h: 26, depth: 190 });
  });
});

describe('overlaps', () => {
  const hero = bodyBounds(216, 190, 190, hurt);
  const canopy = (x: number): { x: number; y: number; w: number; h: number; depth: number } => ({
    x,
    y: 179,
    w: 32,
    h: 44,
    depth: 221.75,
  });

  it('ignores a canopy that only reaches the transparent margin beside the hero', () => {
    expect(overlaps(canopy(224), hero)).toBe(false);
    expect(overlapsRect(224, 179, 32, 44, hero)).toBe(false);
  });

  it('sees a canopy that covers the hero body', () => {
    expect(overlaps(canopy(214), hero)).toBe(true);
    expect(overlapsRect(214, 179, 32, 44, hero)).toBe(true);
  });
});
