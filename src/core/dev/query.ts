import type { ScreenId } from '@content/world/screens';
import { setMinute, setSeason } from '../clock/clock';
import { isSeason, type Season } from '../clock/types';
import { LANGS, type Lang } from '../i18n/t';
import type { GameState } from '../state/gameState';
import { tileFeet } from '../world/screen';

/** Dev/test URL parameters. Only honoured in dev and `--mode test` builds. */
export interface DevQuery {
  readonly screen?: ScreenId;
  readonly tile?: readonly [number, number];
  readonly season?: Season;
  readonly minute?: number;
  readonly seed?: number;
  readonly lang?: Lang;
  readonly nosave: boolean;
  readonly mute: boolean;
  readonly warnings: readonly string[];
}

/** "HH:MM", "day" (12:00) or "night" (00:00) → minute of the day, or null. */
export function parseClockTime(text: string): number | null {
  if (text === 'day') return 12 * 60;
  if (text === 'night') return 0;
  const m = /^(\d{1,2}):(\d{2})$/.exec(text);
  if (m === null) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h > 23 || min > 59 ? null : h * 60 + min;
}

function decode(text: string, warnings: string[]): string | null {
  try {
    return decodeURIComponent(text.replace(/\+/g, ' '));
  } catch {
    warnings.push(`could not decode '${text}'`);
    return null;
  }
}

export function parseDevQuery(search: string, knownScreens: ReadonlySet<string>): DevQuery {
  const warnings: string[] = [];
  const params = new Map<string, string>();
  for (const part of search.replace(/^\?/, '').split('&')) {
    if (part === '') continue;
    const eq = part.indexOf('=');
    const key = decode(eq < 0 ? part : part.slice(0, eq), warnings);
    const value = decode(eq < 0 ? '' : part.slice(eq + 1), warnings);
    if (key !== null && value !== null) params.set(key, value);
  }

  let screen: ScreenId | undefined;
  const s = params.get('screen');
  if (s !== undefined) {
    if (knownScreens.has(s)) screen = s as ScreenId;
    else warnings.push(`unknown screen '${s}'`);
  }

  let tile: [number, number] | undefined;
  const at = params.get('at');
  if (at !== undefined) {
    const m = /^(\d+),(\d+)$/.exec(at);
    if (m === null) warnings.push(`bad at '${at}' (use x,y in tiles)`);
    else tile = [Number(m[1]), Number(m[2])];
  }

  let season: Season | undefined;
  const se = params.get('season');
  if (se !== undefined) {
    if (isSeason(se)) season = se;
    else warnings.push(`unknown season '${se}'`);
  }

  let minute: number | undefined;
  const time = params.get('time');
  if (time !== undefined) {
    const parsed = parseClockTime(time);
    if (parsed === null) warnings.push(`bad time '${time}'`);
    else minute = parsed;
  }

  let seed: number | undefined;
  const sd = params.get('seed');
  if (sd !== undefined) {
    if (/^\d+$/.test(sd)) seed = Number(sd) >>> 0;
    else warnings.push(`bad seed '${sd}'`);
  }

  let lang: Lang | undefined;
  const lg = params.get('lang');
  if (lg !== undefined) {
    const found = LANGS.find((l) => l === lg);
    if (found === undefined) warnings.push(`unknown language '${lg}'`);
    else lang = found;
  }

  return {
    screen,
    tile,
    season,
    minute,
    seed,
    lang,
    nosave: params.has('nosave'),
    mute: params.has('mute'),
    warnings,
  };
}

/** Applies a dev query to a fresh or loaded state before the Sim starts. */
export function applyDevQuery(state: GameState, q: DevQuery): void {
  if (q.screen !== undefined) {
    state.hero.screen = q.screen;
    if (!state.world.visited.includes(q.screen)) state.world.visited.push(q.screen);
  }
  if (q.tile !== undefined) {
    const p = tileFeet({ x: q.tile[0], y: q.tile[1] });
    state.hero.x = p.x;
    state.hero.y = p.y;
  }
  if (q.season !== undefined) setSeason(state.clock, q.season);
  if (q.minute !== undefined) setMinute(state.clock, q.minute);
}
