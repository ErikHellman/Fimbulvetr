import { describe, expect, it } from 'vitest';
import { isSavedAt, planSync } from '@core/state/cloudSync';

const SLOTS = ['auto', 's1', 's2', 's3'] as const;
const at = (s: string): string => `2026-10-25T${s}:00.000Z`;

describe('isSavedAt', () => {
  it('accepts the ISO timestamps makeSave writes and nothing else', () => {
    expect(isSavedAt(at('12:00'))).toBe(true);
    expect(isSavedAt('2026-10-25T12:00:00Z')).toBe(true);
    expect(isSavedAt('yesterday')).toBe(false);
    expect(isSavedAt(42)).toBe(false);
  });
});

describe('planSync', () => {
  it('does nothing when both sides match or are empty', () => {
    expect(planSync(SLOTS, {}, {})).toEqual([]);
    expect(planSync(SLOTS, { s1: at('10:00') }, { s1: at('10:00') })).toEqual([]);
  });

  it('sends saves the cloud lacks and fetches saves this browser lacks', () => {
    expect(planSync(SLOTS, { s1: at('10:00') }, { s2: at('11:00') })).toEqual([
      { slot: 's1', dir: 'push' },
      { slot: 's2', dir: 'pull' },
    ]);
  });

  it('lets the newer save win in each slot', () => {
    expect(
      planSync(SLOTS, { auto: at('12:00'), s3: at('08:00') }, { auto: at('11:59'), s3: at('09:00') }),
    ).toEqual([
      { slot: 'auto', dir: 'push' },
      { slot: 's3', dir: 'pull' },
    ]);
  });

  it('overwrites a cloud copy whose timestamp is unreadable, and never fetches one', () => {
    expect(planSync(SLOTS, { s1: at('10:00') }, { s1: 'garbage', s2: 'garbage' })).toEqual([
      { slot: 's1', dir: 'push' },
    ]);
  });

  it('ignores slots outside the list', () => {
    expect(planSync(['s1'], { s2: at('10:00') }, { s3: at('10:00') })).toEqual([]);
  });
});
