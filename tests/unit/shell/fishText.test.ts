import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { fishPanel, type FishUi } from '@shell/ui/fishText';

const base: FishUi = {
  k: 'fish',
  phase: 'idle',
  t: 0,
  float: { x: 0, y: 0 },
  nibble: false,
  bite: false,
  tension: 0,
  band: [150, 850],
  dist: 0,
  maxDist: 0,
  surging: false,
  fish: null,
  result: null,
};

describe('the fishing panel', () => {
  it('tells what to do in each phase, in both languages', () => {
    expect(fishPanel(base, DB, 'en').text).toContain('Cast');
    expect(fishPanel(base, DB, 'sv').text).toContain('Kasta');
    expect(fishPanel({ ...base, phase: 'bite', bite: true }, DB, 'en').text).toContain('Strike');
  });

  it('shows the tension against its band while reeling, and warns when it leaves it', () => {
    const reel: FishUi = { ...base, phase: 'reel', tension: 500, dist: 300, maxDist: 1000, fish: 'perch' };
    const p = fishPanel(reel, DB, 'en');
    expect(p.tension).toEqual({ at: 0.5, band: [0.15, 0.85], danger: false });
    expect(p.dist).toBeCloseTo(0.3);
    expect(fishPanel({ ...reel, tension: 900 }, DB, 'en').tension?.danger).toBe(true);
    expect(fishPanel({ ...reel, surging: true }, DB, 'en').text).toContain('run');
  });

  it('names the fish landed and what Kári pays', () => {
    const p = fishPanel({ ...base, phase: 'result', result: 'landed', fish: 'gamli' }, DB, 'sv');
    expect(p.text).toBe('Gamle, den gamla gäddan! Kári betalar 50 silver.');
    expect(fishPanel({ ...base, phase: 'result', result: 'snapped' }, DB, 'en').text).toContain('line broke');
  });
});
