import * as Phaser from 'phaser';
import type { WeatherKind } from '@core/clock/types';
import type { FrameIndex } from '@shell/gfx/frameIndex';
import { GAME_W } from '@shell/scale';

/** Rain falls over the world (graded with it) but under the dark; the lightning flash is above all. */
export const RAIN_DEPTH = 400_000;
const FLASH_DEPTH = 900_000;
const PLAY_H = 352;

export interface WeatherHost {
  /** Plays a sound unless muted. */
  sfx(id: 'sfx_thunder'): void;
  /** Whether flashes are allowed (the accessibility setting). */
  flashes(): boolean;
}

/**
 * The sky's weather on screen. `storm`: slanting rain over the whole playfield, and every few seconds a
 * lightning flash followed by thunder. Other kinds draw nothing yet (M2). Timing is wall-clock and random:
 * weather is presentation only.
 */
export class WeatherView {
  private readonly rain: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly flash: Phaser.GameObjects.Rectangle;
  private kind: WeatherKind = 'clear';
  private nextBolt = 0;
  private thunderAt = 0;
  private paused = false;
  /** Bolts so far (for the dev hook). */
  bolts = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    frames: FrameIndex,
    private readonly host: WeatherHost,
  ) {
    const drop = frames.get('fx_rain_idle_s_0');
    this.rain = scene.add
      .particles(0, 0, drop.key, {
        frame: drop.frame,
        x: { min: -60, max: GAME_W + 20 },
        y: { min: -24, max: -8 },
        speedX: { min: -110, max: -80 },
        speedY: { min: 380, max: 460 },
        lifespan: 1000,
        frequency: 12,
        quantity: 3,
        alpha: { start: 0.75, end: 0.35 },
        maxAliveParticles: 220,
        emitting: false,
      })
      .setScrollFactor(0)
      .setDepth(RAIN_DEPTH);
    this.flash = scene.add
      .rectangle(0, 0, GAME_W, PLAY_H, 0xe8f0ff)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(FLASH_DEPTH)
      .setAlpha(0);
  }

  /** Follows the sim's weather; `now` is the scene clock in ms. */
  update(kind: WeatherKind, now: number): void {
    if (kind !== this.kind) {
      this.kind = kind;
      if (kind === 'storm') {
        this.rain.start(0);
        this.rain.fastForward(900);
        this.nextBolt = now + 1500 + Math.random() * 2500;
      } else this.rain.stop(true);
    }
    if (this.paused) return;
    if (this.flash.alpha > 0) this.flash.setAlpha(Math.max(0, this.flash.alpha - 0.06));
    if (this.thunderAt > 0 && now >= this.thunderAt) {
      this.thunderAt = 0;
      this.host.sfx('sfx_thunder');
    }
    if (kind !== 'storm' || now < this.nextBolt) return;
    this.bolts += 1;
    if (this.host.flashes()) this.flash.setAlpha(0.7);
    this.thunderAt = now + 300 + Math.random() * 700;
    this.nextBolt = now + 4000 + Math.random() * 5000;
  }

  /** The pause menu freezes the rain. */
  setPaused(paused: boolean): void {
    this.paused = paused;
    this.rain.active = !paused;
  }

  get drops(): number {
    return this.rain.getAliveParticleCount();
  }

  destroy(): void {
    this.rain.destroy();
    this.flash.destroy();
  }
}
