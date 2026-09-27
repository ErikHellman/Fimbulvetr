import type { WeatherKind } from '../clock/types';

/** A light that carves the dark: a circle around a point, in screen pixels. */
export interface Light {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  /** Carried by the hero: the view keeps it on the drawn hero (screen slides move the hero smoothly). */
  readonly hero?: boolean;
}

/** How dark the deepest night gets outdoors (the visibility layer's opacity; the grade darkens too). */
export const NIGHT_DARK = 0.5;
/** A dark room underground. */
export const DARK_ROOM = 0.94;
/** Extra dark under storm clouds. */
export const STORM_DARK = 0.12;
/** Daylight above which there is no darkness at all. */
const DUSK_LIGHT = 0.55;

export const LANTERN_RADIUS = 56;
export const FIRE_RADIUS = 28;

export interface Place {
  readonly indoor: boolean;
  readonly dark: boolean;
  readonly weather: WeatherKind;
}

/** 0 = nothing is hidden … 1 = pitch black, from daylight (0 night … 1 day) and where the hero is. */
export function darknessOf(daylight: number, place: Place): number {
  if (place.dark) return DARK_ROOM;
  if (place.indoor) return 0;
  const night = Math.min(1, Math.max(0, (DUSK_LIGHT - daylight) / DUSK_LIGHT)) * NIGHT_DARK;
  if (night === 0) return 0;
  return Math.min(1, night + (place.weather === 'storm' ? STORM_DARK : 0));
}
