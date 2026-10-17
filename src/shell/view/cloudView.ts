import type * as Phaser from 'phaser';
import type { WeatherKind } from '@core/clock/types';
import type { Vec } from '@core/math/vec';
import { GAME_W } from '@shell/scale';

export const CLOUDS_KEY = 'clouds';
const PLAY_H = 352;
/** Between the shade overlay (-0.5) and the first sprite, so clouds darken the ground, not the people. */
const CLOUD_DEPTH = -0.4;
/** Clouds drift on their own, and faster with the wind (sim wind is px per tick). */
const DRIFT_PX_PER_S = 7;
/** The 256 px texture is drawn at twice its size, so one cloud spans a good part of the screen. */
const CLOUD_SCALE = 2;
const WIND_TO_PX = 60 * 0.6;
/** How strong the shadows are per sky: none under an even overcast, where there is no sun to cast them. */
const STRENGTH: Readonly<Record<WeatherKind, number>> = {
  clear: 0.6,
  wind: 0.6,
  snow: 0.3,
  rain: 0.15,
  fog: 0,
  storm: 0,
};
/** Daylight below which the sun is too low for cloud shadows, and the span over which they fade in. */
const DAWN = 0.35;
const FADE = 0.3;

/** Soft cloud shadows drifting over outdoor ground by day. Presentation only: wall-clock timed. */
export class CloudView {
  private readonly sprite: Phaser.GameObjects.TileSprite;
  private last = 0;
  shown = 0;

  constructor(scene: Phaser.Scene) {
    this.sprite = scene.add
      .tileSprite(0, 0, GAME_W, PLAY_H, CLOUDS_KEY)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(CLOUD_DEPTH)
      .setTileScale(CLOUD_SCALE, CLOUD_SCALE)
      .setVisible(false);
  }

  update(sky: { daylight: number; weather: WeatherKind; outdoors: boolean; wind: Vec }, now: number): void {
    const dt = this.last === 0 ? 0 : Math.min(100, now - this.last);
    this.last = now;
    const sun = Math.min(1, Math.max(0, (sky.daylight - DAWN) / FADE));
    const alpha = sky.outdoors ? sun * STRENGTH[sky.weather] : 0;
    this.shown = alpha;
    if (alpha <= 0) {
      this.sprite.setVisible(false);
      return;
    }
    this.sprite.setVisible(true).setAlpha(alpha);
    const s = dt / 1000;
    this.sprite.tilePositionX += (DRIFT_PX_PER_S + sky.wind.x * WIND_TO_PX) * s;
    this.sprite.tilePositionY += (DRIFT_PX_PER_S * 0.4 + sky.wind.y * WIND_TO_PX) * s;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
