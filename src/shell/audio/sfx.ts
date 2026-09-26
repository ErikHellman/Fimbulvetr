import * as Phaser from 'phaser';
import { SFX_BANK } from '@art/sfx/bank';
import { synth } from '@art/sfx/synth';
import { SFX, type SfxId } from '@content/ids';
import { fnv1a } from '@core/math/hash';
import type { SimEvent } from '@core/sim/events';

/** Renders every SFX recipe into an AudioBuffer in Phaser's audio cache, under its SfxId. */
export function registerSfx(scene: Phaser.Scene): boolean {
  const sound = scene.sound;
  if (!(sound instanceof Phaser.Sound.WebAudioSoundManager)) return false;
  const ctx = sound.context;
  for (const id of SFX) {
    const samples = synth(SFX_BANK[id], ctx.sampleRate, fnv1a(id));
    const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
    buffer.copyToChannel(samples, 0);
    scene.cache.audio.add(id, buffer);
  }
  return true;
}

/** Plays `sfx` events. Phaser unlocks Web Audio on the first key press or click. */
export class AudioDirector {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly volume: () => number,
    private readonly muted: boolean,
  ) {}

  handle(events: readonly SimEvent[]): void {
    for (const ev of events) if (ev.t === 'sfx') this.play(ev.id);
  }

  play(id: SfxId): void {
    if (this.muted || !this.scene.cache.audio.exists(id)) return;
    this.scene.sound.play(id, { volume: this.volume() });
  }
}
