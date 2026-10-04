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
/** Extra dark under a misty region's fog at night (Niflmýrr): the darkest nights in the game. */
export const MIST_DARK = 0.18;
/** Daylight above which there is no darkness at all. */
const DUSK_LIGHT = 0.55;

export const LANTERN_RADIUS = 56;
/** How thick fog hangs outdoors (the fog layer's opacity outside the clear circle). */
export const FOG_THICK = 0.8;
/** In fog Ask sees about five tiles around them… */
export const FOG_RADIUS = 80;
/** …and seven with the lantern. */
export const LANTERN_FOG_RADIUS = 112;
/** In a fog room (Helgrind) only a small circle round Ask is clear, or the lantern's own light. */
export const FOG_ROOM_RADIUS = 32;
export const FIRE_RADIUS = 28;
/** An awake warp stone's faint glow. */
export const WARP_RADIUS = 28;
/** A wisp ember's faint glow. */
export const EMBER_RADIUS = 22;

export interface Place {
  readonly indoor: boolean;
  readonly dark: boolean;
  readonly weather: WeatherKind;
  /** A region where the fog never lifts (Niflmýrr), whatever the sky. */
  readonly misty?: boolean;
  /** A room filled with fog (Helgrind's fog rooms, Náströnd's last stand), indoors or not. */
  readonly fogRoom?: boolean;
}

/** 0 = nothing is hidden … 1 = pitch black, from daylight (0 night … 1 day) and where the hero is. */
export function darknessOf(daylight: number, place: Place): number {
  if (place.dark) return DARK_ROOM;
  if (place.indoor) return 0;
  const night = Math.min(1, Math.max(0, (DUSK_LIGHT - daylight) / DUSK_LIGHT)) * NIGHT_DARK;
  if (night === 0) return 0;
  const extra = (place.weather === 'storm' ? STORM_DARK : 0) + (place.misty === true ? MIST_DARK : 0);
  return Math.min(1, night + extra);
}

/** How thick the fog is where the hero stands: outdoors in fog, outdoors in a misty region, or in a fog room. */
export function fogOf(place: Place): number {
  if (place.fogRoom === true) return FOG_THICK;
  if (place.indoor || place.dark) return 0;
  return place.weather === 'fog' || place.misty === true ? FOG_THICK : 0;
}
