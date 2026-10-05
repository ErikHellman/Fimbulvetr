import type { RegionId } from '@content/ids';
import type { Season, WeatherKind } from './types';

export interface ClockRules {
  /** Sim ticks per game minute (60 → one game day is 24 real minutes). */
  readonly ticksPerMinute: number;
  /** Days per season while the season policy is `cycling`. */
  readonly seasonDays: number;
  /** Minute of the day the sun rises, per season. */
  readonly sunrise: Readonly<Record<Season, number>>;
  /** Minutes of daylight, per season. */
  readonly daylight: Readonly<Record<Season, number>>;
  /** Length (minutes) of the dawn and dusk ramps. */
  readonly twilight: number;
  /** Weather weights (percent) per season. */
  readonly weather: Readonly<Record<Season, Readonly<Partial<Record<WeatherKind, number>>>>>;
  /** Regions whose season never follows the calendar. */
  readonly fixedSeason: Readonly<Partial<Record<RegionId, Season>>>;
  /** Regions with weather tables of their own, per season (otherwise `weather`). */
  readonly regionWeather?: Readonly<
    Partial<Record<RegionId, Readonly<Record<Season, Readonly<Partial<Record<WeatherKind, number>>>>>>>
  >;
  /** Regions where the fog never lifts outdoors, whatever the sky (Niflmýrr). */
  readonly misty?: readonly RegionId[];
  /** Regions where a snow sky is a blizzard (M9): a white veil, and a wind that pushes Ask. */
  readonly blizzard?: readonly RegionId[];
}
