import { describe, expect, it } from 'vitest';
import { frameFor, frameName, type AnimTable } from '@art/anims';

const table: AnimTable = {
  hero: {
    walk: { frames: 4, fps: 8, loop: true, dirs: ['s', 'n', 'w', 'e'] },
    roll: { frames: 4, fps: 12, loop: false, dirs: ['s'] },
  },
};

describe('frameFor', () => {
  it('names frames by convention', () => {
    expect(frameName('hero', 'walk', 's', 2)).toBe('hero_walk_s_2');
  });

  it('loops looping animations', () => {
    expect(frameFor(table, 'hero', 'walk', 'e', 0)).toBe('hero_walk_e_0');
    expect(frameFor(table, 'hero', 'walk', 'e', 30)).toBe('hero_walk_e_0');
    expect(frameFor(table, 'hero', 'walk', 'e', 8)).toBe('hero_walk_e_1');
  });

  it('holds the last frame of one-shots and falls back to the first direction', () => {
    expect(frameFor(table, 'hero', 'roll', 'w', 999)).toBe('hero_roll_s_3');
  });

  it('points unknown animations at a missing frame name', () => {
    expect(frameFor(table, 'hero', 'dance', 's', 0)).toBe('hero_dance_missing');
  });
});
