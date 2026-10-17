import * as Phaser from 'phaser';
import type { RenderedTrack } from '@art/music/render';
import type { MusicId } from '@content/music';
import type { MusicCue } from '@core/audio/music';
import type { MusicRequest } from './musicWorker';

/**
 * Plays the music: one looping track with its combat and night stems on top, crossfading when the cue
 * changes. A recording in Phaser's audio cache under a track's key (and `<key>_combat`, `<key>_night`)
 * wins; otherwise the placeholder is composed in a worker on first use. One player per game, so the music
 * runs on from the title into play.
 */

const REGISTRY_KEY = 'music_player';
/** Placeholder music renders at this rate; Web Audio resamples it. */
const RATE = 22_050;
/** Tracks kept rendered (about 13 MB each), the playing one included. */
const KEEP = 3;
/** Time constants (s) of the fades: tracks crossfade, stems come in quickly and leave over about 3 s. */
const TRACK_FADE = 0.4;
const LAYER_IN = 0.3;
const LAYER_OUT = 1;

interface Buffers {
  readonly main: AudioBuffer;
  readonly combat: AudioBuffer | null;
  readonly night: AudioBuffer | null;
}

interface Playing {
  readonly id: MusicId;
  readonly gain: GainNode;
  readonly combat: GainNode;
  readonly night: GainNode;
  readonly sources: readonly AudioBufferSourceNode[];
  combatOn: boolean;
  nightOn: boolean;
}

type Rendered = RenderedTrack & { readonly id: MusicId };

export class MusicPlayer {
  private readonly ctx: AudioContext;
  private readonly out: GainNode;
  private readonly buffers = new Map<MusicId, Buffers>();
  private readonly pending = new Set<MusicId>();
  private worker: Worker | null | undefined;
  private playing: Playing | null = null;
  private level = -1;

  private constructor(
    private readonly sound: Phaser.Sound.WebAudioSoundManager,
    private readonly cache: Phaser.Cache.BaseCache,
  ) {
    this.ctx = sound.context;
    this.out = this.ctx.createGain();
    this.out.gain.value = 0;
    this.out.connect(sound.destination);
  }

  /** The game's player, or null where there is no Web Audio. */
  static of(scene: Phaser.Scene): MusicPlayer | null {
    const sound = scene.sound;
    if (!(sound instanceof Phaser.Sound.WebAudioSoundManager)) return null;
    const held: unknown = scene.game.registry.get(REGISTRY_KEY);
    if (held instanceof MusicPlayer) return held;
    const player = new MusicPlayer(sound, scene.cache.audio);
    scene.game.registry.set(REGISTRY_KEY, player);
    return player;
  }

  /** Once a frame: the music wanted now (null: silence) at `level` (0 to 1). */
  set(cue: MusicCue | null, level: number): void {
    const now = this.ctx.currentTime;
    if (level !== this.level) {
      this.level = level;
      this.out.gain.setTargetAtTime(level, now, 0.05);
    }
    if (cue === null || level <= 0) {
      this.stop(now);
      return;
    }
    if (this.playing?.id !== cue.track) {
      const buffers = this.get(cue.track);
      // The old track plays on until the new one is ready (and the browser lets sound play).
      if (buffers === null || this.sound.locked) return;
      this.stop(now);
      this.playing = this.start(cue.track, buffers, now);
    }
    const p = this.playing;
    if (p.combatOn !== cue.combat) {
      p.combatOn = cue.combat;
      p.combat.gain.setTargetAtTime(cue.combat ? 1 : 0, now, cue.combat ? LAYER_IN : LAYER_OUT);
    }
    if (p.nightOn !== cue.night) {
      p.nightOn = cue.night;
      p.night.gain.setTargetAtTime(cue.night ? 1 : 0, now, cue.night ? LAYER_IN : LAYER_OUT);
    }
  }

  private start(id: MusicId, b: Buffers, now: number): Playing {
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(1, now, TRACK_FADE);
    gain.connect(this.out);
    const layer = (): GainNode => {
      const g = this.ctx.createGain();
      g.gain.value = 0;
      g.connect(gain);
      return g;
    };
    const combat = layer();
    const night = layer();
    const when = now + 0.05;
    const sources: AudioBufferSourceNode[] = [];
    for (const [buffer, into] of [
      [b.main, gain],
      [b.combat, combat],
      [b.night, night],
    ] as const) {
      if (buffer === null) continue;
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      src.connect(into);
      src.start(when);
      sources.push(src);
    }
    document.body.dataset.music = id;
    return { id, gain, combat, night, sources, combatOn: false, nightOn: false };
  }

  private stop(now: number): void {
    const p = this.playing;
    if (p === null) return;
    this.playing = null;
    delete document.body.dataset.music;
    p.gain.gain.cancelScheduledValues(now);
    p.gain.gain.setTargetAtTime(0, now, TRACK_FADE);
    for (const src of p.sources) src.stop(now + TRACK_FADE * 6);
    const last = p.sources[0];
    if (last !== undefined)
      last.onended = () => {
        p.gain.disconnect();
      };
  }

  /** The track's buffers if ready; otherwise starts making them and returns null. */
  private get(id: MusicId): Buffers | null {
    const have = this.buffers.get(id);
    if (have !== undefined) {
      this.buffers.delete(id);
      this.buffers.set(id, have);
      return have;
    }
    const recorded = this.recorded(id);
    if (recorded !== null) {
      this.keep(id, recorded);
      return recorded;
    }
    if (!this.pending.has(id)) {
      this.pending.add(id);
      void this.render(id).then(
        (r) => {
          this.pending.delete(id);
          this.keep(id, this.toBuffers(r));
        },
        (e: unknown) => {
          console.warn(`[music] ${id} failed`, e);
        },
      );
    }
    return null;
  }

  private recorded(id: MusicId): Buffers | null {
    const buf = (key: string): AudioBuffer | null => {
      if (!this.cache.exists(key)) return null;
      const v: unknown = this.cache.get(key);
      return v instanceof AudioBuffer ? v : null;
    };
    const main = buf(id);
    return main === null ? null : { main, combat: buf(`${id}_combat`), night: buf(`${id}_night`) };
  }

  private keep(id: MusicId, b: Buffers): void {
    this.buffers.set(id, b);
    for (const old of this.buffers.keys()) {
      if (this.buffers.size <= KEEP) break;
      if (old !== this.playing?.id && old !== id) this.buffers.delete(old);
    }
  }

  private toBuffers(r: Rendered): Buffers {
    const mono = (s: Float32Array<ArrayBuffer>): AudioBuffer => {
      const b = this.ctx.createBuffer(1, s.length, r.sampleRate);
      b.copyToChannel(s, 0);
      return b;
    };
    const main = this.ctx.createBuffer(2, r.left.length, r.sampleRate);
    main.copyToChannel(r.left, 0);
    main.copyToChannel(r.right, 1);
    return { main, combat: mono(r.combat), night: mono(r.night) };
  }

  private render(id: MusicId): Promise<Rendered> {
    if (this.worker === undefined) {
      try {
        this.worker = new Worker(new URL('./musicWorker.ts', import.meta.url), { type: 'module' });
      } catch {
        this.worker = null;
      }
    }
    const worker = this.worker;
    if (worker === null)
      return import('@art/music/render').then(async ({ renderScore }) => {
        const { MUSIC_SCORES } = await import('@art/music/scores');
        return { id, ...renderScore(MUSIC_SCORES[id], RATE) };
      });
    return new Promise((resolve, reject) => {
      const onMessage = (e: MessageEvent<Rendered>): void => {
        if (e.data.id !== id) return;
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        resolve(e.data);
      };
      const onError = (e: ErrorEvent): void => {
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        reject(new Error(e.message));
      };
      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);
      const req: MusicRequest = { id, sampleRate: RATE };
      worker.postMessage(req);
    });
  }
}

/** How loud the music plays: the master volume times the music level, or nothing under `?mute`. */
export function musicLevel(s: { readonly volume: number; readonly music: number }, muted: boolean): number {
  return muted ? 0 : s.volume * s.music;
}
