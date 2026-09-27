import type { WeatherRule } from '@core/sim/db';
import { raidNight } from './dialogue/util';

/**
 * Story weather, first match wins; otherwise the sky is clear. Rolled weather (rain, wind, fog, snow by
 * season) arrives in M2; `weatherAt` already computes it.
 */
export const WEATHER_RULES: readonly WeatherRule[] = [
  /** The first autumn storm, the night of the raid. */
  { when: raidNight, kind: 'storm' },
];
