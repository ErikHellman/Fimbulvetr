import type { Season, WeatherKind } from '@core/clock/types';

/** 4×5 colour matrix, row-major, as Phaser's ColorMatrix expects (offset column in 0–255). */
export type Matrix = readonly number[];

export const IDENTITY: Matrix = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

const at = (m: Matrix, i: number): number => m[i] ?? 0;

/** a ∘ b: apply b first, then a. */
export function multiply(a: Matrix, b: Matrix): number[] {
  const out: number[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 5; c++) {
      let v = c === 4 ? at(a, r * 5 + 4) : 0;
      for (let k = 0; k < 4; k++) v += at(a, r * 5 + k) * at(b, k * 5 + c);
      out.push(v);
    }
  }
  return out;
}

export function lerpMatrix(a: Matrix, b: Matrix, t: number): number[] {
  return a.map((v, i) => v + (at(b, i) - v) * t);
}

export function applyMatrix(m: Matrix, rgb: readonly [number, number, number]): [number, number, number] {
  const [r, g, b] = rgb;
  const row = (i: number): number =>
    at(m, i * 5) * r +
    at(m, i * 5 + 1) * g +
    at(m, i * 5 + 2) * b +
    at(m, i * 5 + 3) * 255 +
    at(m, i * 5 + 4);
  return [row(0), row(1), row(2)];
}

function channels(r: number, g: number, b: number, or = 0, og = 0, ob = 0): Matrix {
  return [r, 0, 0, 0, or, 0, g, 0, 0, og, 0, 0, b, 0, ob, 0, 0, 0, 1, 0];
}

function saturation(s: number): Matrix {
  const lr = 0.2126 * (1 - s);
  const lg = 0.7152 * (1 - s);
  const lb = 0.0722 * (1 - s);
  return [lr + s, lg, lb, 0, 0, lr, lg + s, lb, 0, 0, lr, lg, lb + s, 0, 0, 0, 0, 0, 1, 0];
}

const SEASON: Readonly<Record<Season, Matrix>> = {
  summer: channels(1.04, 1.02, 0.94),
  autumn: multiply(channels(1.08, 0.98, 0.86), saturation(0.9)),
  winter: multiply(channels(0.94, 0.99, 1.12, 0, 4, 10), saturation(0.72)),
  spring: channels(0.98, 1.05, 0.98),
};

const NIGHT: Matrix = channels(0.3, 0.36, 0.6, 0, 0, 8);
const DUSK: Matrix = channels(1.12, 0.9, 0.78);

const WEATHER: Readonly<Record<WeatherKind, Matrix>> = {
  clear: IDENTITY,
  wind: IDENTITY,
  rain: multiply(channels(0.85, 0.87, 0.93), saturation(0.75)),
  fog: multiply(channels(0.85, 0.85, 0.87, 28, 28, 30), saturation(0.6)),
  snow: multiply(channels(1.02, 1.04, 1.08), saturation(0.8)),
  storm: multiply(channels(0.72, 0.76, 0.88), saturation(0.6)),
};

/** The world camera's colour matrix for a season, a daylight level (0 night … 1 day) and weather. */
export function grade(season: Season, light: number, weather: WeatherKind): number[] {
  const duskAmount = (1 - Math.abs(2 * light - 1)) * 0.6;
  const timeOfDay = multiply(lerpMatrix(IDENTITY, DUSK, duskAmount), lerpMatrix(NIGHT, IDENTITY, light));
  return multiply(WEATHER[weather], multiply(timeOfDay, SEASON[season]));
}
