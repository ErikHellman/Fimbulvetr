export const SEASONS = ['summer', 'autumn', 'winter', 'spring'] as const;
export type Season = (typeof SEASONS)[number];

export const isSeason = (s: string): s is Season => (SEASONS as readonly string[]).includes(s);

export const WEATHER_KINDS = ['clear', 'rain', 'wind', 'fog', 'snow'] as const;
export type WeatherKind = (typeof WEATHER_KINDS)[number];

export const MINUTES_PER_DAY = 1440;

/** The world clock. `held` seasons only change by story; `cycling` seasons also turn every N days. */
export interface ClockState {
  minute: number;
  sub: number;
  day: number;
  season: Season;
  seasonDay: number;
  epoch: number;
  policy: 'held' | 'cycling';
}

export type ClockEvent =
  | { readonly t: 'dawn' }
  | { readonly t: 'dusk' }
  | { readonly t: 'newDay'; readonly day: number }
  | { readonly t: 'season'; readonly from: Season; readonly to: Season };

export function newClock(): ClockState {
  return { minute: 8 * 60, sub: 0, day: 1, season: 'summer', seasonDay: 0, epoch: 0, policy: 'held' };
}
