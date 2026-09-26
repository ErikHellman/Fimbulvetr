import type * as Phaser from 'phaser';

export const GAME_W = 640;
export const GAME_H = 360;
/** Vertical letterbox above and below the 640×352 playfield. */
export const LETTERBOX = 4;

export type Scaling = 'integer' | 'fit';

/**
 * CSS zoom for the 640×360 canvas. Integer mode picks the largest whole multiple in *device* pixels, so
 * pixel art stays crisp at any devicePixelRatio; if even 1× does not fit, it shrinks to fit instead.
 */
export function computeZoom(winW: number, winH: number, dpr: number, mode: Scaling): number {
  const fit = Math.min(winW / GAME_W, winH / GAME_H);
  if (mode === 'fit') return fit;
  const whole = Math.floor(Math.min((winW * dpr) / GAME_W, (winH * dpr) / GAME_H));
  return whole < 1 ? fit : whole / dpr;
}

export function attachZoom(game: Phaser.Game, mode: () => Scaling): () => void {
  const apply = (): void => {
    game.scale.setZoom(
      computeZoom(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1, mode()),
    );
  };
  apply();
  window.addEventListener('resize', apply);
  return () => {
    window.removeEventListener('resize', apply);
  };
}
