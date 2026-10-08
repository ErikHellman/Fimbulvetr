import type { RegionId } from '@content/ids';
import { fnv1a, hashInts, unitFromHash } from '../math/hash';
import type { Vec } from '../math/vec';
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
  const table = rules.regionWeather?.[region]?.[season] ?? rules.weather[season];
  const base = hashInts(seed, day, fnv1a(region));
  const morning = pick(table, unitFromHash(base));
  if (unitFromHash(hashInts(base, 1)) >= CHANGE_CHANCE) return morning;
  const changeAt = EARLIEST_CHANGE + Math.floor(unitFromHash(hashInts(base, 2)) * CHANGE_SPAN);
  return minute < changeAt ? morning : pick(table, unitFromHash(hashInts(base, 3)));
}

const DIAG = 0.7071067811865476;

/** The eight ways the wind can blow, as unit vectors (screen y points down). */
export const WIND_DIRS: readonly Vec[] = [
  { x: 1, y: 0 },
  { x: DIAG, y: DIAG },
  { x: 0, y: 1 },
  { x: -DIAG, y: DIAG },
  { x: -1, y: 0 },
  { x: -DIAG, y: -DIAG },
  { x: 0, y: -1 },
  { x: DIAG, y: -DIAG },
];

/** How hard each kind of weather blows (px per tick added to a projectile, and the particle push). */
export const WIND_STRENGTH: Readonly<Record<WeatherKind, number>> = {
  clear: 0,
  rain: 0.15,
  wind: 0.5,
  fog: 0,
  snow: 0.2,
  storm: 0.8,
};

/** The wind for a region on a day: one hashed direction all day, its strength from the weather. */
export function windAt(seed: number, day: number, region: RegionId, kind: WeatherKind): Vec {
  const strength = WIND_STRENGTH[kind];
  if (strength === 0) return { x: 0, y: 0 };
  const dir = WIND_DIRS[hashInts(seed, day, fnv1a(region), 4) % WIND_DIRS.length] ?? { x: 1, y: 0 };
  return { x: dir.x * strength, y: dir.y * strength };
}
