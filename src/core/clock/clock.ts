import type { RegionId } from '@content/ids';
import type { ClockRules } from './rules';
import { MINUTES_PER_DAY, SEASONS, type ClockEvent, type ClockState, type Season } from './types';

const mod = (a: number, n: number): number => ((a % n) + n) % n;
const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

function nextSeason(s: Season): Season {
  const i = SEASONS.indexOf(s);
  return SEASONS[(i + 1) % SEASONS.length] ?? 'summer';
}

/** The only way seasons change; bumps the epoch so ground cover regrows. */
export function setSeason(c: ClockState, to: Season): ClockEvent[] {
  const from = c.season;
  if (from === to) return [];
  c.season = to;
  c.seasonDay = 0;
  c.epoch += 1;
  return [{ t: 'season', from, to }];
}

export function setPolicy(c: ClockState, policy: ClockState['policy']): void {
  c.policy = policy;
}

export function setMinute(c: ClockState, minute: number): void {
  c.minute = mod(Math.floor(minute), MINUTES_PER_DAY);
  c.sub = 0;
}

function advanceMinute(c: ClockState, rules: ClockRules): ClockEvent[] {
  const events: ClockEvent[] = [];
  c.minute += 1;
  if (c.minute >= MINUTES_PER_DAY) {
    c.minute = 0;
    c.day += 1;
    events.push({ t: 'newDay', day: c.day });
    if (c.policy === 'cycling') {
      c.seasonDay += 1;
      if (c.seasonDay >= rules.seasonDays) events.push(...setSeason(c, nextSeason(c.season)));
    }
  }
  const sunrise = rules.sunrise[c.season];
  const sunset = mod(sunrise + rules.daylight[c.season], MINUTES_PER_DAY);
  if (c.minute === sunrise) events.push({ t: 'dawn' });
  if (c.minute === sunset) events.push({ t: 'dusk' });
  return events;
}

/** One sim tick of world time. The sim does not call this in dungeons, menus, cutscenes or transitions. */
export function tickClock(
  c: ClockState,
  rules: ClockRules,
  ticksPerMinute: number = rules.ticksPerMinute,
): ClockEvent[] {
  c.sub += 1;
  if (c.sub < ticksPerMinute) return [];
  c.sub = 0;
  return advanceMinute(c, rules);
}

export function isNight(c: ClockState, rules: ClockRules): boolean {
  const since = mod(c.minute - rules.sunrise[c.season], MINUTES_PER_DAY);
  return since >= rules.daylight[c.season];
}

/** 1 in full day, 0 in full night, with linear ramps of `twilight` minutes centred on sunrise and sunset. */
export function daylight(c: ClockState, rules: ClockRules): number {
  const half = rules.twilight / 2;
  const length = rules.daylight[c.season];
  let since = mod(c.minute + c.sub / rules.ticksPerMinute - rules.sunrise[c.season], MINUTES_PER_DAY);
  if (since > MINUTES_PER_DAY - half) since -= MINUTES_PER_DAY;
  const rising = clamp01((since + half) / rules.twilight);
  const falling = clamp01((length + half - since) / rules.twilight);
  return Math.min(rising, falling);
}

export function seasonAt(c: ClockState, region: RegionId, rules: ClockRules): Season {
  return rules.fixedSeason[region] ?? c.season;
}
