import type { RegionId } from '@content/ids';
import { fnv1a, hashInts, unitFromHash } from '../math/hash';
import type { ClockRules } from './rules';
import { WEATHER_KINDS, type Season, type WeatherKind } from './types';

const CHANGE_CHANCE = 0.3;
const EARLIEST_CHANGE = 10 * 60;
const CHANGE_SPAN = 8 * 60;

function pick(table: Readonly<Partial<Record<WeatherKind, number>>>, u: number): WeatherKind {
  let total = 0;
  for (const k of WEATHER_KINDS) total += table[k] ?? 0;
  let x = u * total;
  for (const k of WEATHER_KINDS) {
    const w = table[k] ?? 0;
    if (x < w) return k;
    x -= w;
  }
  return 'clear';
}

/**
 * Weather for a region: rolled each morning from (seed, day, region) and possibly changing once between
 * 10:00 and 18:00. Stateless, so combat randomness never changes the weather and tests stay stable.
 */
export function weatherAt(
  seed: number,
  day: number,
  minute: number,
  region: RegionId,
  season: Season,
  rules: ClockRules,
): WeatherKind {
  const table = rules.weather[season];
  const base = hashInts(seed, day, fnv1a(region));
  const morning = pick(table, unitFromHash(base));
  if (unitFromHash(hashInts(base, 1)) >= CHANGE_CHANCE) return morning;
  const changeAt = EARLIEST_CHANGE + Math.floor(unitFromHash(hashInts(base, 2)) * CHANGE_SPAN);
  return minute < changeAt ? morning : pick(table, unitFromHash(hashInts(base, 3)));
}
