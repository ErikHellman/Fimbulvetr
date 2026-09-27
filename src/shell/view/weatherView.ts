import * as Phaser from 'phaser';
import type { Season, WeatherKind } from '@core/clock/types';
import type { Vec } from '@core/math/vec';
import type { FrameIndex } from '@shell/gfx/frameIndex';
import { GAME_W } from '@shell/scale';

/** Rain falls over the world (graded with it) but under the dark; the lightning flash is above all. */
export const RAIN_DEPTH = 400_000;
const FLASH_DEPTH = 900_000;
const PLAY_H = 352;
/** Sim wind (px per tick) to particle drift (px per second), a little exaggerated so it reads. */
const WIND_TO_PX = 60 * 4;
/** The most particles the weather keeps alive at once (the budget is 500 for everything). */
const MAX_DROPS = 220;
const MAX_FLAKES = 260;
const MAX_LEAVES = 60;

export interface WeatherHost {
  /** Plays a sound unless muted. */
  sfx(id: 'sfx_thunder' | 'sfx_wind'): void;
  /** Whether flashes are allowed (the accessibility setting). */
  flashes(): boolean;
}

/** What the sky is doing over the current screen. */
export interface Sky {
  readonly kind: WeatherKind;
  readonly season: Season;
  readonly wind: Vec;
}

type Emitter = Phaser.GameObjects.Particles.ParticleEmitter;

/**
 * The sky's weather on screen, all in camera space over the playfield:
 * - `storm`: slanting rain, and every few seconds a lightning flash followed by thunder;
 * - `rain`: straight streaks slanted by the wind;
 * - `snow`: flakes drifting down and sideways with the wind;
 * - `wind`: leaves blowing across (snow in winter), with a gust now and then.
 * Fog is drawn by a FogView. Timing is wall-clock and random: weather is presentation only.
 */
export class WeatherView {
  private readonly storm: Emitter;
  private readonly rain: Emitter;
  private readonly snow: Emitter;
  private readonly leaves: Emitter;
  private readonly flash: Phaser.GameObjects.Rectangle;
  private key = 'clear';
  private nextBolt = 0;
  private thunderAt = 0;
  private nextGust = 0;
  private paused = false;
  /** Bolts so far (for the dev hook). */
  bolts = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    frames: FrameIndex,
    private readonly host: WeatherHost,
  ) {
    const slanted = frames.get('fx_rain_idle_s_0');
    this.storm = this.emitter(slanted.key, [slanted.frame], {
      x: { min: -60, max: GAME_W + 20 },
      y: { min: -24, max: -8 },
      speedX: { min: -110, max: -80 },
      speedY: { min: 380, max: 460 },
      lifespan: 1000,
      frequency: 12,
      quantity: 3,
      alpha: { start: 0.75, end: 0.35 },
      maxAliveParticles: MAX_DROPS,
    });
    const drop = frames.get('fx_drop_idle_s_0');
    this.rain = this.emitter(drop.key, [drop.frame], {
      x: { min: -80, max: GAME_W + 80 },
      y: { min: -24, max: -8 },
      speedY: { min: 360, max: 430 },
      lifespan: 1000,
      frequency: 16,
      quantity: 2,
      alpha: { start: 0.6, end: 0.3 },
      maxAliveParticles: MAX_DROPS,
    });
    this.snow = this.emitter(...sameTexture(frames, ['fx_snow_idle_s_0', 'fx_snow_idle_s_1']), {
      x: { min: -120, max: GAME_W + 120 },
      y: { min: -12, max: -4 },
      speedY: { min: 22, max: 48 },
      lifespan: 9000,
      frequency: 40,
      quantity: 2,
      alpha: { start: 0.95, end: 0.6 },
      maxAliveParticles: MAX_FLAKES,
    });
    this.leaves = this.emitter(
      ...sameTexture(frames, ['fx_leaf_idle_s_0', 'fx_leaf_idle_s_1', 'fx_leaf_idle_s_2']),
      {
        x: { min: -40, max: GAME_W + 40 },
        y: { min: -20, max: PLAY_H },
        lifespan: 3200,
        frequency: 90,
        quantity: 1,
        rotate: { start: 0, end: 540 },
        alpha: { start: 1, end: 0.2 },
        maxAliveParticles: MAX_LEAVES,
      },
    );
    this.flash = scene.add
      .rectangle(0, 0, GAME_W, PLAY_H, 0xe8f0ff)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(FLASH_DEPTH)
      .setAlpha(0);
  }

  private emitter(
    key: string,
    frame: readonly string[],
    config: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig,
  ): Emitter {
    return this.scene.add
      .particles(0, 0, key, { ...config, frame: [...frame], emitting: false })
      .setScrollFactor(0)
      .setDepth(RAIN_DEPTH);
  }

  /** Follows the sim's sky; `now` is the scene clock in ms. */
  update(sky: Sky, now: number): void {
    const wx = sky.wind.x * WIND_TO_PX;
    const wy = sky.wind.y * WIND_TO_PX;
    const key = `${sky.kind}|${sky.season}|${Math.round(wx)}|${Math.round(wy)}`;
    if (key !== this.key) this.change(sky, wx, wy, now);
    if (this.paused) return;
    if (this.flash.alpha > 0) this.flash.setAlpha(Math.max(0, this.flash.alpha - 0.06));
    if (this.thunderAt > 0 && now >= this.thunderAt) {
      this.thunderAt = 0;
      this.host.sfx('sfx_thunder');
    }
    if ((sky.kind === 'wind' || sky.kind === 'storm') && now >= this.nextGust) {
      if (this.nextGust > 0) this.host.sfx('sfx_wind');
      this.nextGust = now + 6000 + Math.random() * 7000;
    }
    if (sky.kind !== 'storm' || now < this.nextBolt) return;
    this.bolts += 1;
    if (this.host.flashes()) this.flash.setAlpha(0.7);
    this.thunderAt = now + 300 + Math.random() * 700;
    this.nextBolt = now + 4000 + Math.random() * 5000;
  }

  private change(sky: Sky, wx: number, wy: number, now: number): void {
    const was = this.key.split('|')[0];
    this.key = `${sky.kind}|${sky.season}|${Math.round(wx)}|${Math.round(wy)}`;
    const blowing = sky.kind === 'wind';
    const want = {
      storm: sky.kind === 'storm',
      rain: sky.kind === 'rain',
      snow: sky.kind === 'snow' || (blowing && sky.season === 'winter'),
      leaves: blowing && sky.season !== 'winter',
    };
    // Slant the straight rain with the wind; blow flakes and leaves along it.
    this.rain.updateConfig({ speedX: { min: wx - 10, max: wx + 10 }, rotate: -toDeg(Math.atan2(wx, 400)) });
    this.snow.updateConfig({
      speedX: { min: wx * (blowing ? 1.6 : 1) - 12, max: wx * (blowing ? 1.6 : 1) + 12 },
      speedY: blowing ? { min: 40, max: 80 } : { min: 22, max: 48 },
    });
    this.leaves.updateConfig({
      speedX: { min: wx * 1.2 - 20, max: wx * 1.2 + 20 },
      speedY: { min: wy * 1.2 - 10, max: wy * 1.2 + 40 },
    });
    const set = (e: Emitter, on: boolean, warm: number): void => {
      if (on && !e.emitting) {
        e.start(0);
        e.fastForward(warm);
      } else if (!on && e.emitting) e.stop(true);
    };
    set(this.storm, want.storm, 900);
    set(this.rain, want.rain, 900);
    set(this.snow, want.snow, 6000);
    set(this.leaves, want.leaves, 1500);
    if (want.storm && was !== 'storm') this.nextBolt = now + 1500 + Math.random() * 2500;
  }

  /** The pause menu freezes the weather. */
  setPaused(paused: boolean): void {
    this.paused = paused;
    for (const e of [this.storm, this.rain, this.snow, this.leaves]) e.active = !paused;
  }

  /** Raindrops alive (storm or rain). */
  get drops(): number {
    return this.storm.getAliveParticleCount() + this.rain.getAliveParticleCount();
  }

  get flakes(): number {
    return this.snow.getAliveParticleCount();
  }

  get blown(): number {
    return this.leaves.getAliveParticleCount();
  }

  destroy(): void {
    for (const e of [this.storm, this.rain, this.snow, this.leaves]) e.destroy();
    this.flash.destroy();
  }
}

const toDeg = (rad: number): number => (rad * 180) / Math.PI;

/** The frames of one emitter must share a texture page; fall back to the first frame's page alone. */
function sameTexture(frames: FrameIndex, names: readonly string[]): [string, string[]] {
  const refs = names.map((n) => frames.get(n));
  const first = refs[0];
  if (first === undefined) throw new Error('no frames');
  return [first.key, refs.filter((r) => r.key === first.key).map((r) => r.frame)];
}
