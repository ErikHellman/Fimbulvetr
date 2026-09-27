import type { ArmorId, DungeonId, GaldrId, ItemId, WeaponId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import { setMinute, setPolicy, setSeason } from '../clock/clock';
import { WEATHER_KINDS, isSeason, type ClockState, type Season, type WeatherKind } from '../clock/types';
import { LANGS, type Lang } from '../i18n/t';
import type { Dir4 } from '../math/dir';
import type { Flags } from '../state/flags';
import { dungeonOf } from '../state/dungeons';
import type { DungeonState, GameState } from '../state/gameState';
import { tileFeet } from '../world/screen';

/** Dev/test URL parameters. Only honoured in dev and `--mode test` builds. */
export interface DevQuery {
  readonly screen?: ScreenId;
  readonly tile?: readonly [number, number];
  readonly season?: Season;
  readonly minute?: number;
  readonly seed?: number;
  readonly lang?: Lang;
  /** A named starting kit from content/dev/presets (validated against the known ids). */
  readonly preset?: string;
  /** `weather=<kind>`: the dev weather override, as the console's `weather` command. */
  readonly weather?: WeatherKind;
  /** `rolled=0`: no rolled weather or spawn tables (the e2e runs pin it off). */
  readonly rolled: boolean;
  /** `title=0` skips the title screen, `title=1` shows it even with a screen or preset named. */
  readonly title?: boolean;
  /** `dev=gallery`: show the texture gallery instead of the game. */
  readonly gallery: boolean;
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

export function parseDevQuery(
  search: string,
  knownScreens: ReadonlySet<string>,
  knownPresets: ReadonlySet<string> = new Set(),
): DevQuery {
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

  let preset: string | undefined;
  const pr = params.get('preset');
  if (pr !== undefined) {
    if (knownPresets.has(pr)) preset = pr;
    else warnings.push(`unknown preset '${pr}'`);
  }

  let weather: WeatherKind | undefined;
  const we = params.get('weather');
  if (we !== undefined) {
    const found = WEATHER_KINDS.find((k) => k === we);
    if (found === undefined) warnings.push(`unknown weather '${we}'`);
    else weather = found;
  }

  const ro = params.get('rolled');
  if (ro !== undefined && ro !== '0' && ro !== '1') warnings.push(`bad rolled '${ro}' (use 0 or 1)`);

  const ti = params.get('title');
  if (ti !== undefined && ti !== '0' && ti !== '1') warnings.push(`bad title '${ti}' (use 0 or 1)`);

  const dev = params.get('dev');
  if (dev !== undefined && dev !== 'gallery') warnings.push(`unknown dev view '${dev}'`);

  return {
    screen,
    tile,
    season,
    minute,
    seed,
    lang,
    preset,
    weather,
    rolled: ro !== '0',
    ...(ti === '0' || ti === '1' ? { title: ti === '1' } : {}),
    gallery: dev === 'gallery',
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

/** A named dev starting point: where the hero stands, what they carry, which story flags are set. */
export interface DevPreset {
  readonly screen: ScreenId;
  readonly tile: readonly [number, number];
  readonly facing?: Dir4;
  readonly weapon: WeaponId;
  readonly shield: boolean;
  readonly flags?: Flags;
  readonly minute?: number;
  readonly silver?: number;
  readonly items?: Readonly<Partial<Record<ItemId, number>>>;
  readonly vars?: Readonly<Record<string, number>>;
  readonly season?: Season;
  readonly policy?: ClockState['policy'];
  /** Health and heart containers, in quarter hearts. */
  readonly hp?: number;
  readonly maxHp?: number;
  readonly slots?: readonly [ItemId | null, ItemId | null];
  /** Heart pieces and chests already taken (their persisted ids). */
  readonly pieces?: readonly string[];
  readonly opened?: readonly string[];
  readonly dungeons?: Readonly<Partial<Record<DungeonId, Partial<DungeonState>>>>;
  readonly armor?: ArmorId;
  readonly galdr?: readonly GaldrId[];
  /** Seiðr now (the bar's size stays 10 unless `maxSeidr` says otherwise). */
  readonly seidr?: number;
  readonly maxSeidr?: number;
}

/** Applies a preset to a fresh state. A dev query's own screen/at/season/time still win afterwards. */
export function applyPreset(state: GameState, p: DevPreset): void {
  applyDevQuery(state, {
    screen: p.screen,
    tile: p.tile,
    rolled: true,
    gallery: false,
    nosave: false,
    mute: false,
    warnings: [],
  });
  if (p.facing !== undefined) state.hero.facing = p.facing;
  state.inv.weapon = p.weapon;
  state.inv.shield = p.shield;
  Object.assign(state.flags, p.flags ?? {});
  if (p.minute !== undefined) setMinute(state.clock, p.minute);
  if (p.silver !== undefined) state.hero.silver = p.silver;
  Object.assign(state.inv.items, p.items ?? {});
  Object.assign(state.world.vars, p.vars ?? {});
  if (p.season !== undefined) setSeason(state.clock, p.season);
  if (p.policy !== undefined) setPolicy(state.clock, p.policy);
  if (p.maxHp !== undefined) state.hero.maxHp = p.maxHp;
  if (p.hp !== undefined) state.hero.hp = Math.min(p.hp, state.hero.maxHp);
  else state.hero.hp = Math.min(state.hero.hp, state.hero.maxHp);
  if (p.slots !== undefined) state.inv.slots = [p.slots[0], p.slots[1]];
  for (const id of p.pieces ?? []) if (!state.world.pieces.includes(id)) state.world.pieces.push(id);
  for (const id of p.opened ?? []) if (!state.world.opened.includes(id)) state.world.opened.push(id);
  for (const [id, d] of Object.entries(p.dungeons ?? {}) as [DungeonId, Partial<DungeonState>][])
    Object.assign(dungeonOf(state, id), d);
  if (p.armor !== undefined) state.inv.armor = p.armor;
  if (p.galdr !== undefined) state.inv.galdr = [...p.galdr];
  if (p.maxSeidr !== undefined) state.hero.maxSeidr = p.maxSeidr;
  if (p.seidr !== undefined) state.hero.seidr = Math.min(p.seidr, state.hero.maxSeidr);
}
