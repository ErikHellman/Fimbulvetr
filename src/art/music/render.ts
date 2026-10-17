import { createRng } from '@core/math/rng';
import { compose, type Note, type Score } from './compose';
import { renderVoice } from './voices';

/** A rendered track: the stereo loop and its two mono stems (each a whole number of times shorter). */
export interface RenderedTrack {
  readonly sampleRate: number;
  readonly left: Float32Array<ArrayBuffer>;
  readonly right: Float32Array<ArrayBuffer>;
  readonly combat: Float32Array<ArrayBuffer>;
  readonly night: Float32Array<ArrayBuffer>;
}

/** Loudness of each voice in the mix. */
const GAIN = {
  fiddle: 0.32,
  harp: 0.4,
  flute: 0.3,
  bow: 0.18,
  bass: 0.3,
  drone: 0.2,
  drum: 0.55,
  tom: 0.35,
  shaker: 0.16,
} as const;

/** Adds a note into a looping buffer: whatever runs past the end comes round to the start. */
function mix(into: Float32Array, at: number, src: Float32Array, gain: number): void {
  const n = into.length;
  let j = at % n;
  for (let i = 0; i < src.length; i++) {
    into[j] = (into[j] ?? 0) + (src[i] ?? 0) * gain;
    j++;
    if (j === n) j = 0;
  }
}

/**
 * A small Schroeder hall (four damped combs into two all-passes), run twice over the loop so its tail at the
 * end flows into the start and the loop has no seam.
 */
function reverb(dry: Float32Array, sr: number, wet: number, spread: number): Float32Array<ArrayBuffer> {
  const scale = sr / 44_100;
  const combs = [1116, 1188, 1277, 1356].map((d) => Math.max(1, Math.round((d + spread) * scale)));
  const passes = [556, 441].map((d) => Math.max(1, Math.round((d + spread) * scale)));
  const cb = combs.map((d) => new Float32Array(d));
  const cs = combs.map(() => 0);
  const ci = combs.map(() => 0);
  const ab = passes.map((d) => new Float32Array(d));
  const ai = passes.map(() => 0);
  const out = new Float32Array(dry.length);
  for (let pass = 0; pass < 2; pass++)
    for (let i = 0; i < dry.length; i++) {
      const x = (dry[i] ?? 0) * 0.25;
      let y = 0;
      for (let k = 0; k < cb.length; k++) {
        const buf = cb[k] as Float32Array;
        const idx = ci[k] ?? 0;
        const v = buf[idx] ?? 0;
        cs[k] = v * 0.7 + (cs[k] ?? 0) * 0.3;
        buf[idx] = x + (cs[k] ?? 0) * 0.8;
        ci[k] = (idx + 1) % buf.length;
        y += v;
      }
      for (let k = 0; k < ab.length; k++) {
        const buf = ab[k] as Float32Array;
        const idx = ai[k] ?? 0;
        const v = buf[idx] ?? 0;
        buf[idx] = y + v * 0.5;
        ai[k] = (idx + 1) % buf.length;
        y = v - y * 0.5;
      }
      if (pass === 1) out[i] = (dry[i] ?? 0) * (1 - wet * 0.5) + y * wet;
    }
  return out;
}

/** Takes out any DC offset, scales to a peak and rounds off anything above it softly. */
function master(buffers: readonly Float32Array[], target: number): void {
  for (const b of buffers) {
    let mean = 0;
    for (const v of b) mean += v;
    mean /= Math.max(1, b.length);
    for (let i = 0; i < b.length; i++) b[i] = (b[i] ?? 0) - mean;
  }
  let peak = 1e-9;
  for (const b of buffers) for (const v of b) peak = Math.max(peak, Math.abs(v));
  const g = target / peak;
  for (const b of buffers)
    for (let i = 0; i < b.length; i++) b[i] = Math.tanh((b[i] ?? 0) * g * 1.2) / Math.tanh(1.2);
}

export function renderScore(score: Score, sampleRate: number): RenderedTrack {
  const song = compose(score);
  const stemLen = Math.round(song.stemSeconds * sampleRate);
  const len = stemLen * (score.bars / 4);
  const left = new Float32Array(len);
  const right = new Float32Array(len);
  const combat = new Float32Array(stemLen);
  const night = new Float32Array(stemLen);
  const rng = createRng((score.theme * 31 + score.root) >>> 0);
  const place = (n: Note): void => {
    const sound = renderVoice(n.voice, n.midi, n.dur, sampleRate, rng);
    const at = Math.round(n.t * sampleRate);
    const g = GAIN[n.voice] * n.vel;
    if (n.stem === 'combat') mix(combat, at, sound, g);
    else if (n.stem === 'night') mix(night, at, sound, g);
    else {
      // Equal-power pan.
      const angle = ((n.pan + 1) * Math.PI) / 4;
      mix(left, at, sound, g * Math.cos(angle));
      mix(right, at, sound, g * Math.sin(angle));
    }
  };
  for (const n of song.notes) place(n);
  const wetL = reverb(left, sampleRate, score.reverb, 0);
  const wetR = reverb(right, sampleRate, score.reverb, 23);
  const wetCombat = reverb(combat, sampleRate, 0.15, 0);
  const wetNight = reverb(night, sampleRate, 0.5, 11);
  master([wetL, wetR], 0.75);
  master([wetCombat], 0.6);
  master([wetNight], 0.5);
  return { sampleRate, left: wetL, right: wetR, combat: wetCombat, night: wetNight };
}
