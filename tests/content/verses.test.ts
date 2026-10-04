import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { VERSES } from '@content/verses';

describe('the skald’s verses', () => {
  it('each marks a grid screen with a heart piece of its own, under a flag of its own', () => {
    expect(VERSES.length).toBeGreaterThanOrEqual(3);
    expect(new Set(VERSES.map((v) => v.flag)).size).toBe(VERSES.length);
    expect(new Set(VERSES.map((v) => v.piece)).size).toBe(VERSES.length);
    for (const v of VERSES) {
      expect(DB.layout.at[v.screen], v.screen).toBeDefined();
      expect(v.flag).toMatch(/^w_verse_/);
      expect(v.text.en.length).toBeGreaterThan(0);
      expect(v.text.sv.length).toBeGreaterThan(0);
    }
  });
});
