import { createRng, nextFloat, type RngState } from '@core/math/rng';

/**
 * A placeholder composer in the spirit of Nordic folk: a modal tune over a drone, a lyre or harp under it,
 * frame drums. A `Score` is a few knobs; `compose` turns it into notes, deterministically per `theme`.
 */

export type Mode = 'ionian' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'aeolian';

export const MODES: Readonly<Record<Mode, readonly number[]>> = {
  ionian: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
};

export type Lead = 'fiddle' | 'harp' | 'flute';
export type Voice = Lead | 'bow' | 'bass' | 'drone' | 'drum' | 'tom' | 'shaker';
/** `main` is the track itself; `combat` and `night` are the adaptive stems, a four-bar loop each. */
export type Stem = 'main' | 'combat' | 'night';

export interface Score {
  /** Seeds the tune: variants of one theme (a region and its winter) share it. */
  readonly theme: number;
  /** MIDI note of the tonic, in the lead's register. */
  readonly root: number;
  readonly mode: Mode;
  readonly bpm: number;
  /** Beats in a bar: 3 is a polska, 4 a walk or a march. */
  readonly beats: 3 | 4;
  /** Loop length in bars: sections of four, played A A' B A' (and on). */
  readonly bars: 8 | 16 | 24 | 32;
  /** The tune's instrument: nyckelharpa-like fiddle, lyre, or bone flute. */
  readonly lead: Lead;
  /** What fills under the tune: lyre arpeggios, bowed chords, both, or nothing. */
  readonly accomp: 'harp' | 'pad' | 'both' | 'none';
  readonly bass: boolean;
  /** A tagelharpa-like drone on the tonic and fifth. */
  readonly drone: boolean;
  readonly drums: 'none' | 'pulse' | 'march' | 'war';
  /** 0 to 1: how often a beat splits into shorter notes. */
  readonly busy: number;
  /** 0 to 1: how much of the hall is heard. */
  readonly reverb: number;
}

export interface Note {
  readonly voice: Voice;
  /** Start and length in seconds; tails past the loop's end wrap round to its start. */
  readonly t: number;
  readonly dur: number;
  readonly midi: number;
  /** 0 to 1. */
  readonly vel: number;
  /** -1 left to 1 right. */
  readonly pan: number;
  readonly stem: Stem;
}

export interface Composition {
  readonly notes: readonly Note[];
  /** The loop's length; the stems loop every four bars. */
  readonly seconds: number;
  readonly stemSeconds: number;
}

/** Octave shift of each lead from the score's root. */
export const LEAD_OCTAVE: Readonly<Record<Lead, number>> = { fiddle: 0, harp: 0, flute: 12 };

/** Chord roots (scale degrees) per bar of each kind of section. */
const CHORDS = {
  a: [0, 6, 5, 4],
  a2: [0, 6, 4, 0],
  b: [5, 6, 3, 4],
} as const;

interface Tone {
  /** In beats from the phrase's start. */
  readonly at: number;
  readonly len: number;
  readonly deg: number;
}

const pick = <T>(rng: RngState, items: readonly T[]): T =>
  items[Math.floor(nextFloat(rng) * items.length)] ?? (items[0] as T);

/** One bar of note lengths (in beats). `end` leaves a long last note for a cadence. */
function rhythm(rng: RngState, beats: number, busy: number, end: boolean): number[] {
  const out: number[] = [];
  let b = 0;
  const stop = end ? beats - (beats === 4 ? 2 : 1) : beats;
  while (b < stop) {
    const left = stop - b;
    const r = nextFloat(rng);
    if (left >= 2 && b % 2 === 0 && r < (1 - busy) * 0.3) {
      out.push(2);
      b += 2;
    } else if (r < 0.35 + busy * 0.4) {
      const cell = pick(
        rng,
        beats === 3
          ? [
              [0.5, 0.5],
              [0.75, 0.25],
              [0.5, 0.25, 0.25],
            ]
          : [
              [0.5, 0.5],
              [0.75, 0.25],
              [0.25, 0.25, 0.5],
            ],
      );
      out.push(...cell);
      b += 1;
    } else {
      out.push(1);
      b += 1;
    }
  }
  if (end) out.push(beats - stop);
  return out;
}

const chordTones = (c: number): number[] => [c, c + 2, c + 4].map((d) => ((d % 7) + 7) % 7);

function nearest(deg: number, wanted: readonly number[]): number {
  let best = deg;
  let dist = Infinity;
  for (let d = deg - 4; d <= deg + 4; d++)
    if (wanted.includes(((d % 7) + 7) % 7) && Math.abs(d - deg) < dist) {
      best = d;
      dist = Math.abs(d - deg);
    }
  return best;
}

/** Two bars of tune over two chords, from `start`; `end` is the degree it lands on (or null to run on). */
function phrase(
  rng: RngState,
  s: Score,
  chords: readonly [number, number],
  start: number,
  end: number | null,
): Tone[] {
  const out: Tone[] = [];
  let deg = start;
  let at = 0;
  for (let bar = 0; bar < 2; bar++) {
    const lens = rhythm(rng, s.beats, s.busy, end !== null && bar === 1);
    for (let i = 0; i < lens.length; i++) {
      const len = lens[i] ?? 1;
      if (out.length > 0) {
        const r = nextFloat(rng);
        const step = r < 0.55 ? 1 : r < 0.8 ? 2 : r < 0.92 ? 3 + Math.floor(nextFloat(rng) * 2) : 0;
        deg += nextFloat(rng) < 0.5 ? -step : step;
        if (deg > 9) deg = 18 - deg;
        if (deg < -2) deg = -4 - deg;
      }
      const strong = Number.isInteger(at) && at % s.beats === 0;
      if (strong && nextFloat(rng) < 0.7) deg = nearest(deg, chordTones(chords[bar] ?? 0));
      const last = end !== null && bar === 1 && i === lens.length - 1;
      if (last) deg = nearest(deg, [end]);
      out.push({ at, len, deg });
      at += len;
    }
  }
  return out;
}

/** Scale degree (any octave) to MIDI. */
export function midiOf(s: Score, deg: number): number {
  const scale = MODES[s.mode];
  const oct = Math.floor(deg / 7);
  return s.root + oct * 12 + (scale[deg - oct * 7] ?? 0);
}

export function compose(s: Score): Composition {
  const beat = 60 / s.bpm;
  const bar = beat * s.beats;
  const seconds = bar * s.bars;
  const notes: Note[] = [];
  const add = (n: Note): void => {
    notes.push(n);
  };

  // The tune: motifs drawn from the theme alone, so every arrangement of a theme sings the same melody.
  const motif = (salt: number): RngState => createRng((s.theme * 7919 + salt) >>> 0);
  const sections: Array<keyof typeof CHORDS> = [];
  for (let i = 0; i < s.bars / 4; i++) sections.push(i === 0 ? 'a' : i % 2 === 1 ? 'a2' : 'b');
  sections.forEach((kind, i) => {
    const c = CHORDS[kind];
    const head =
      kind === 'b'
        ? phrase(motif(3 + (i % 4)), s, [c[0], c[1]], 4, null)
        : phrase(motif(1), s, [c[0], c[1]], 2, null);
    const tail = phrase(
      motif(kind === 'a2' ? 2 : kind === 'a' ? 2 : 5 + (i % 4)),
      s,
      [c[2], c[3]],
      head.at(-1)?.deg ?? 2,
      kind === 'a2' ? 0 : 4,
    );
    const t0 = i * 4 * bar;
    for (const [off, tones] of [
      [0, head],
      [2 * bar, tail],
    ] as const)
      for (const tone of tones)
        add({
          voice: s.lead,
          t: t0 + off + tone.at * beat,
          dur: tone.len * beat,
          midi: midiOf(s, tone.deg) + LEAD_OCTAVE[s.lead],
          vel: strongVel(tone.at, s.beats),
          pan: 0,
          stem: 'main',
        });

    // Harmony per bar.
    c.forEach((root, b) => {
      const t = t0 + b * bar;
      if (s.accomp === 'harp' || s.accomp === 'both') {
        const arp = [0, 2, 4, 7, 4, 2, 0, 4].slice(0, s.beats * 2);
        arp.forEach((d, k) => {
          add({
            voice: 'harp',
            t: t + k * (beat / 2),
            dur: beat * 1.5,
            midi: midiOf(s, root + d) - 12,
            vel: k === 0 ? 0.45 : 0.3,
            pan: k % 2 === 0 ? -0.35 : 0.35,
            stem: 'main',
          });
        });
      }
      if (s.accomp === 'pad' || s.accomp === 'both')
        for (const [d, pan] of [
          [0, -0.4],
          [4, 0.4],
          [2, 0],
        ] as const)
          add({ voice: 'bow', t, dur: bar, midi: midiOf(s, root + d) - 12, vel: 0.22, pan, stem: 'main' });
      if (s.bass)
        add({
          voice: 'bass',
          t,
          dur: bar * 0.95,
          midi: midiOf(s, root) - 24,
          vel: 0.45,
          pan: 0,
          stem: 'main',
        });
    });
    if (s.drone)
      for (const d of [0, 4])
        add({
          voice: 'drone',
          t: t0,
          dur: 4 * bar,
          midi: midiOf(s, d) - 24,
          vel: 0.2,
          pan: d === 0 ? -0.2 : 0.2,
          stem: 'main',
        });
  });

  // Drums in the track itself.
  for (let b = 0; b < s.bars * s.beats; b++) {
    const inBar = b % s.beats;
    const t = b * beat;
    if (s.drums === 'pulse' && inBar === 0) drum(add, 'drum', t, 0.5, 'main');
    if (s.drums === 'march') {
      drum(add, 'drum', t, inBar === 0 ? 0.6 : 0.35, 'main');
      if (inBar === s.beats - 1) drum(add, 'tom', t + beat / 2, 0.3, 'main');
    }
    if (s.drums === 'war') {
      drum(add, 'drum', t, inBar === 0 ? 0.8 : 0.5, 'main');
      drum(add, 'tom', t + beat / 2, 0.35, 'main');
      drum(add, 'shaker', t + beat / 4, 0.2, 'main');
      drum(add, 'shaker', t + (3 * beat) / 4, 0.2, 'main');
    }
  }

  // The combat stem: driving frame drums over four bars.
  const stemSeconds = 4 * bar;
  for (let b = 0; b < 4 * s.beats; b++) {
    const t = b * beat;
    const down = b % s.beats === 0;
    drum(add, 'drum', t, down ? 0.9 : 0.6, 'combat');
    drum(add, 'tom', t + beat / 2, down ? 0.35 : 0.5, 'combat');
    if (b % s.beats === s.beats - 1) drum(add, 'tom', t + (3 * beat) / 4, 0.45, 'combat');
    for (let k = 0; k < 4; k++) drum(add, 'shaker', t + (k * beat) / 4, k === 0 ? 0.35 : 0.2, 'combat');
  }

  // The night stem: a low drone on the tonic, and a far-off call on the fifth once a loop.
  for (const [d, oct] of [
    [0, -36],
    [0, -24],
  ] as const)
    add({
      voice: 'drone',
      t: 0,
      dur: stemSeconds,
      midi: midiOf(s, d) + oct,
      vel: 0.55,
      pan: 0,
      stem: 'night',
    });
  add({ voice: 'flute', t: bar, dur: bar * 1.5, midi: midiOf(s, 4) + 12, vel: 0.18, pan: 0, stem: 'night' });

  return { notes, seconds, stemSeconds };
}

function strongVel(at: number, beats: number): number {
  if (Number.isInteger(at) && at % beats === 0) return 0.75;
  return Number.isInteger(at) ? 0.62 : 0.5;
}

function drum(
  add: (n: Note) => void,
  voice: 'drum' | 'tom' | 'shaker',
  t: number,
  vel: number,
  stem: Stem,
): void {
  add({
    voice,
    t,
    dur: voice === 'drum' ? 0.6 : voice === 'tom' ? 0.3 : 0.08,
    midi: 0,
    vel,
    pan: voice === 'shaker' ? 0.25 : 0,
    stem,
  });
}
