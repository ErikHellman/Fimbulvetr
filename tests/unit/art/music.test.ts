import { describe, expect, it } from 'vitest';
import { compose, LEAD_OCTAVE, MODES, type Score } from '@art/music/compose';
import { renderScore } from '@art/music/render';
import { MUSIC_SCORES, winter } from '@art/music/scores';
import { MUSIC } from '@content/music';

const tiny: Score = {
  theme: 7,
  root: 62,
  mode: 'dorian',
  bpm: 120,
  beats: 4,
  bars: 8,
  lead: 'fiddle',
  accomp: 'harp',
  bass: true,
  drone: true,
  drums: 'pulse',
  busy: 0.5,
  reverb: 0.3,
};

const peak = (s: Float32Array): number => s.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
const inMode = (midi: number, s: Score): boolean =>
  MODES[s.mode].includes((((midi - s.root) % 12) + 12) % 12);

describe('compose', () => {
  it('is deterministic and fits every note inside the loop', () => {
    const a = compose(tiny);
    expect(a).toEqual(compose(tiny));
    expect(a.seconds).toBeCloseTo((8 * 4 * 60) / 120, 6);
    for (const n of a.notes) {
      expect(n.t).toBeGreaterThanOrEqual(0);
      expect(n.t).toBeLessThan(a.seconds);
      expect(n.dur).toBeGreaterThan(0);
    }
  });

  it('keeps the tune in its mode and gives the stems their own notes', () => {
    const { notes } = compose(tiny);
    const lead = notes.filter((n) => n.voice === 'fiddle');
    expect(lead.length).toBeGreaterThan(16);
    for (const n of lead) expect(inMode(n.midi, tiny)).toBe(true);
    expect(notes.some((n) => n.stem === 'combat')).toBe(true);
    expect(notes.some((n) => n.stem === 'night')).toBe(true);
  });

  it('plays the same tune in a winter variant, on another instrument', () => {
    const w = winter(tiny);
    expect(w.lead).toBe('flute');
    expect(w.bpm).toBeLessThan(tiny.bpm);
    const pitches = (s: Score): number[] =>
      compose(s)
        .notes.filter((n) => n.voice === s.lead && n.stem === 'main')
        .map((n) => n.midi - LEAD_OCTAVE[s.lead]);
    expect(pitches(w)).toEqual(pitches(tiny));
  });
});

describe('renderScore', () => {
  it('renders a stereo loop and two stems that divide it evenly, audible and unclipped', () => {
    const r = renderScore(tiny, 8000);
    expect(r.left.length).toBe(r.right.length);
    expect(r.left.length).toBe(r.combat.length * 2);
    expect(r.night.length).toBe(r.combat.length);
    expect(r.left.length).toBeCloseTo(16 * 8000, -2);
    for (const s of [r.left, r.right, r.combat, r.night]) {
      expect(s.every(Number.isFinite)).toBe(true);
      expect(peak(s)).toBeLessThanOrEqual(1);
      expect(peak(s)).toBeGreaterThan(0.1);
    }
  });

  it('is deterministic', () => {
    expect(renderScore(tiny, 4000).left).toEqual(renderScore(tiny, 4000).left);
  });
});

describe('MUSIC_SCORES', () => {
  it('has a score for every track, each looping in under a minute and a quarter', () => {
    for (const id of MUSIC) {
      const s = MUSIC_SCORES[id];
      expect([8, 16, 24, 32]).toContain(s.bars);
      expect(compose(s).seconds).toBeLessThan(75);
    }
  });
});
