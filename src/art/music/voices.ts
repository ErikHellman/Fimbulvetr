import { nextFloat, type RngState } from '@core/math/rng';
import type { Voice } from './compose';

/**
 * The placeholder instruments: each renders one note, mono, into a fresh buffer that may run past the note
 * (a plucked string rings on, a bow lets go). Plain arithmetic oscillators and filters, nothing sampled.
 */

const TAU = 2 * Math.PI;

export const hz = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

/** How long each voice sounds past its note. */
const TAIL: Readonly<Record<Voice, number>> = {
  fiddle: 0.15,
  harp: 1.4,
  flute: 0.2,
  bow: 0.6,
  bass: 0.3,
  drone: 1.5,
  drum: 0,
  tom: 0,
  shaker: 0,
};

/** One-pole low-pass coefficient for a cutoff. */
const lp = (cutoff: number, sr: number): number => 1 - Math.exp((-TAU * cutoff) / sr);

function polyBlep(t: number, dt: number): number {
  if (t < dt) {
    const x = t / dt;
    return x + x - x * x - 1;
  }
  if (t > 1 - dt) {
    const x = (t - 1) / dt;
    return x * x + x + x + 1;
  }
  return 0;
}

/** Attack, then hold until `dur`, then a linear release of `rel`. */
function env(t: number, dur: number, attack: number, rel: number): number {
  if (t < attack) return t / attack;
  if (t < dur) return 1;
  return Math.max(0, 1 - (t - dur) / rel);
}

/** A band-limited sawtooth through two low-pass poles, with vibrato: the bowed voices. */
function bowed(
  out: Float32Array,
  sr: number,
  f: number,
  dur: number,
  o: {
    readonly attack: number;
    readonly rel: number;
    readonly cutoff: number;
    readonly vib: number;
    readonly detune: number;
    readonly octave: number;
  },
): void {
  const a = lp(o.cutoff, sr);
  let p1 = 0;
  let p2 = 0;
  let p3 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / sr;
    const vib = 1 + o.vib * Math.min(1, t * 3) * Math.sin(TAU * 5.3 * t);
    const fa = f * vib * (1 + o.detune);
    const fb = f * vib * (1 - o.detune);
    const d1 = fa / sr;
    const d2 = fb / sr;
    const d3 = (2 * f * vib) / sr;
    p1 = (p1 + d1) % 1;
    p2 = (p2 + d2) % 1;
    p3 = (p3 + d3) % 1;
    const s =
      (2 * p1 - 1 - polyBlep(p1, d1)) * 0.5 +
      (2 * p2 - 1 - polyBlep(p2, d2)) * 0.5 +
      (2 * p3 - 1 - polyBlep(p3, d3)) * o.octave;
    y1 += a * (s - y1);
    y2 += a * (y1 - y2);
    out[i] = y2 * env(t, dur, o.attack, o.rel);
  }
}

/** Karplus–Strong with a fractional delay, so high strings stay in tune at low sample rates. */
function plucked(out: Float32Array, sr: number, f: number, rng: RngState, damp: number): void {
  const delay = Math.max(2, sr / f - 0.5);
  const size = Math.ceil(delay) + 2;
  const line = new Float32Array(size);
  let prev = 0;
  for (let i = 0; i < size; i++) {
    const n = nextFloat(rng) * 2 - 1;
    line[i] = (n + prev) * 0.5;
    prev = n;
  }
  let w = 0;
  let last = 0;
  const fade = Math.round(0.02 * sr);
  for (let i = 0; i < out.length; i++) {
    const r = w - delay;
    const ri = Math.floor(r);
    const frac = r - ri;
    const i0 = ((ri % size) + size) % size;
    const i1 = (i0 + 1) % size;
    const y = (line[i0] ?? 0) * (1 - frac) + (line[i1] ?? 0) * frac;
    line[w % size] = damp * 0.5 * (y + last);
    last = y;
    w++;
    const tail = out.length - i;
    out[i] = y * (tail < fade ? tail / fade : 1);
  }
}

export function renderVoice(
  voice: Voice,
  midi: number,
  dur: number,
  sr: number,
  rng: RngState,
): Float32Array {
  const out = new Float32Array(Math.max(1, Math.round((dur + TAIL[voice]) * sr)));
  const f = hz(midi);
  switch (voice) {
    case 'fiddle':
      bowed(out, sr, f, dur, {
        attack: 0.04,
        rel: 0.15,
        cutoff: 2600,
        vib: 0.004,
        detune: 0.0015,
        octave: 0.12,
      });
      break;
    case 'bow':
      bowed(out, sr, f, dur, { attack: 0.45, rel: 0.6, cutoff: 900, vib: 0.002, detune: 0.002, octave: 0 });
      break;
    case 'bass':
      bowed(out, sr, f, dur, { attack: 0.03, rel: 0.3, cutoff: 420, vib: 0, detune: 0.001, octave: 0 });
      break;
    case 'drone':
      bowed(out, sr, f, dur, {
        attack: 1.5,
        rel: 1.5,
        cutoff: 520,
        vib: 0.0015,
        detune: 0.0025,
        octave: 0.2,
      });
      break;
    case 'harp':
      plucked(out, sr, f, rng, f > 500 ? 0.992 : 0.996);
      break;
    case 'flute': {
      let phase = 0;
      let breath = 0;
      const a = lp(1800, sr);
      for (let i = 0; i < out.length; i++) {
        const t = i / sr;
        phase = (phase + (f * (1 + 0.003 * Math.min(1, t * 2) * Math.sin(TAU * 4.8 * t))) / sr) % 1;
        breath += a * (nextFloat(rng) * 2 - 1 - breath);
        const tone = Math.sin(TAU * phase) + 0.15 * Math.sin(2 * TAU * phase);
        out[i] = (tone * 0.8 + breath * 0.6) * env(t, dur, 0.09, 0.2);
      }
      break;
    }
    case 'drum':
    case 'tom': {
      const base = voice === 'drum' ? 68 : 140;
      const decay = voice === 'drum' ? 7 : 12;
      let phase = 0;
      let noise = 0;
      const a = lp(900, sr);
      for (let i = 0; i < out.length; i++) {
        const t = i / sr;
        phase = (phase + (base * (1 + 1.4 * Math.exp(-t * 28))) / sr) % 1;
        noise += a * (nextFloat(rng) * 2 - 1 - noise);
        out[i] = Math.sin(TAU * phase) * Math.exp(-t * decay) + noise * 0.9 * Math.exp(-t * 45);
      }
      break;
    }
    case 'shaker': {
      let prev = 0;
      for (let i = 0; i < out.length; i++) {
        const n = nextFloat(rng) * 2 - 1;
        out[i] = (n - prev) * 0.5 * Math.exp((-i / sr) * 55);
        prev = n;
      }
      break;
    }
  }
  return out;
}
