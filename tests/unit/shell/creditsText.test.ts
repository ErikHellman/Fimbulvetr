import { describe, expect, it } from 'vitest';
import { CREDITS } from '@content/credits';
import { creditsRoll } from '@shell/ui/creditsText';

describe('the credits roll', () => {
  it('starts below the screen and rises until the last line has passed the middle, then holds', () => {
    const start = creditsRoll('en', 0, 1000, 360, 12);
    expect(start.y).toBe(360);
    expect(start.lines).toHaveLength(CREDITS.length);
    const mid = creditsRoll('en', 400, 1000, 360, 12);
    expect(mid.y).toBeLessThan(360);
    const end = creditsRoll('en', 1000, 1000, 360, 12);
    const last = end.y + (CREDITS.length - 1) * 12;
    expect(last).toBeLessThanOrEqual(180);
    expect(creditsRoll('en', 900, 1000, 360, 12).y).toBe(end.y);
  });

  it('speaks Swedish too', () => {
    expect(creditsRoll('sv', 0, 1000, 360, 12).lines.at(-1)).toContain('norrut');
  });
});
