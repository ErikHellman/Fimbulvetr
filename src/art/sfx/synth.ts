import { createRng, nextFloat } from '@core/math/rng';

export type Wave = 'square' | 'saw' | 'triangle' | 'sine' | 'noise';

/** A tiny parametric synth voice: one oscillator, a linear pitch sweep and an attack/sustain/release envelope. */
export interface SynthParams {
  readonly wave: Wave;
  readonly freq: number;
  readonly freqEnd: number;
  readonly attack: number;
  readonly sustain: number;
  readonly release: number;
  readonly volume: number;
  readonly duty?: number;
}

function envelope(t: number, p: SynthParams): number {
  if (t < p.attack) return p.attack > 0 ? t / p.attack : 1;
  if (t < p.attack + p.sustain) return 1;
  return Math.max(0, 1 - (t - p.attack - p.sustain) / Math.max(p.release, 1e-6));
}

export function synth(p: SynthParams, sampleRate: number, seed: number): Float32Array<ArrayBuffer> {
  const total = Math.max(1, Math.round((p.attack + p.sustain + p.release) * sampleRate));
  const out = new Float32Array(total);
  const rng = createRng(seed);
  let phase = 0;
  let noise = 0;
  let noiseStep = -1;
  for (let i = 0; i < total; i++) {
    const t = i / sampleRate;
    const freq = p.freq + (p.freqEnd - p.freq) * (i / total);
    phase = (phase + freq / sampleRate) % 1;
    let s: number;
    switch (p.wave) {
      case 'square':
        s = phase < (p.duty ?? 0.5) ? 1 : -1;
        break;
      case 'saw':
        s = 2 * phase - 1;
        break;
      case 'triangle':
        s = 1 - 4 * Math.abs(phase - 0.5);
        break;
      case 'sine':
        s = Math.sin(2 * Math.PI * phase);
        break;
      case 'noise': {
        const step = Math.floor(t * freq);
        if (step !== noiseStep) {
          noiseStep = step;
          noise = nextFloat(rng) * 2 - 1;
        }
        s = noise;
        break;
      }
    }
    out[i] = s * envelope(t, p) * p.volume;
  }
  return out;
}
