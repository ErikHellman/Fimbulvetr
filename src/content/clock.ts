import type { ClockRules } from '@core/clock/rules';

export const CLOCK_RULES: ClockRules = {
  ticksPerMinute: 60,
  seasonDays: 6,
  sunrise: { summer: 3 * 60, autumn: 5 * 60, winter: 7 * 60, spring: 5 * 60 },
  daylight: { summer: 18 * 60, autumn: 16 * 60, winter: 12 * 60, spring: 16 * 60 },
  twilight: 90,
  weather: {
    summer: { clear: 60, rain: 25, wind: 15 },
    autumn: { clear: 35, rain: 30, wind: 25, fog: 10 },
    winter: { clear: 30, wind: 20, fog: 10, snow: 40 },
    spring: { clear: 40, rain: 40, wind: 15, fog: 5 },
  },
  fixedSeason: { hrimfjoll: 'winter' },
  /** Niflmýrr's fog is its own (see `misty`): its sky never rains, and in winter it snows through the fog. */
  regionWeather: {
    niflmyrr: {
      summer: { clear: 70, wind: 30 },
      autumn: { clear: 60, wind: 40 },
      winter: { clear: 40, wind: 10, snow: 50 },
      spring: { clear: 70, wind: 30 },
    },
  },
  misty: ['niflmyrr'],
};
