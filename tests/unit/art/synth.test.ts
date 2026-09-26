import { describe, expect, it } from 'vitest';
import { SFX_BANK } from '@art/sfx/bank';
import { synth, type SynthParams } from '@art/sfx/synth';
import { SFX } from '@content/ids';

const params: SynthParams = {
  wave: 'noise',
  freq: 2000,
  freqEnd: 500,
  attack: 0.01,
  sustain: 0.05,
  release: 0.1,
  volume: 0.5,
};
const peak = (s: Float32Array): number => s.reduce((m, v) => Math.max(m, Math.abs(v)), 0);

describe('synth', () => {
  it('produces the right number of samples within the volume', () => {
    const s = synth(params, 48_000, 1);
    expect(s.length).toBe(Math.round(0.16 * 48_000));
    expect(peak(s)).toBeLessThanOrEqual(0.5 + 1e-6);
    expect(peak(s)).toBeGreaterThan(0.1);
  });

  it('is deterministic per seed', () => {
    expect(synth(params, 22_050, 7)).toEqual(synth(params, 22_050, 7));
    expect(synth(params, 22_050, 7)).not.toEqual(synth(params, 22_050, 8));
  });

  it('has an audible, unclipped recipe for every sound id', () => {
    for (const id of SFX) {
      const s = synth(SFX_BANK[id], 44_100, 1);
      expect(peak(s), id).toBeGreaterThan(0.05);
      expect(peak(s), id).toBeLessThanOrEqual(1);
    }
  });
});
