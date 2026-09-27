import { ACTIONS, type Action } from '@core/input/actions';
import { LANGS, type Lang } from '@core/i18n/t';
import type { Scaling } from '@shell/scale';

export interface Settings {
  lang: Lang;
  volume: number;
  scaling: Scaling;
  shake: boolean;
  flash: boolean;
  holdShield: boolean;
  longDay: boolean;
  textSize: 1 | 2 | 3;
  /** Pulls reds and greens apart in the world's colours. */
  colourBlind: boolean;
  /** Keyboard keys per action that differ from the defaults (KeyboardEvent.code values). */
  keys: Partial<Record<Action, readonly string[]>>;
}

export const SETTINGS_KEY = 'fimbulvetr.settings.v1';

export const DEFAULT_SETTINGS: Settings = {
  lang: 'en',
  volume: 0.7,
  scaling: 'integer',
  shake: true,
  flash: true,
  holdShield: false,
  longDay: false,
  textSize: 2,
  colourBlind: false,
  keys: {},
};

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);

const CODE = /^[A-Za-z0-9]{1,24}$/;

/** Only known actions with one to four plausible key codes survive. */
function parseKeys(v: unknown): Settings['keys'] {
  if (typeof v !== 'object' || v === null) return {};
  const out: Partial<Record<Action, readonly string[]>> = {};
  for (const action of ACTIONS) {
    const codes = (v as Record<string, unknown>)[action];
    if (!Array.isArray(codes) || codes.length === 0 || codes.length > 4) continue;
    if (codes.every((c): c is string => typeof c === 'string' && CODE.test(c))) out[action] = [...codes];
  }
  return out;
}

/** Stored JSON merged over validated defaults; anything unusable falls back field by field. */
export function parseSettings(raw: string | null, fallbackLang: Lang): Settings {
  const base: Settings = { ...DEFAULT_SETTINGS, lang: fallbackLang, keys: {} };
  if (raw === null) return base;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return base;
  }
  if (typeof data !== 'object' || data === null) return base;
  const d = data as Record<string, unknown>;
  const lang = LANGS.find((l) => l === d['lang']) ?? base.lang;
  const volume =
    typeof d['volume'] === 'number' && d['volume'] >= 0 && d['volume'] <= 1 ? d['volume'] : base.volume;
  const scaling = d['scaling'] === 'integer' || d['scaling'] === 'fit' ? d['scaling'] : base.scaling;
  const textSize =
    d['textSize'] === 1 || d['textSize'] === 2 || d['textSize'] === 3 ? d['textSize'] : base.textSize;
  return {
    lang,
    volume,
    scaling,
    shake: bool(d['shake'], base.shake),
    flash: bool(d['flash'], base.flash),
    holdShield: bool(d['holdShield'], base.holdShield),
    longDay: bool(d['longDay'], base.longDay),
    textSize,
    colourBlind: bool(d['colourBlind'], base.colourBlind),
    keys: parseKeys(d['keys']),
  };
}

export function loadSettings(storage: StorageLike | null, fallbackLang: Lang): Settings {
  try {
    return parseSettings(storage?.getItem(SETTINGS_KEY) ?? null, fallbackLang);
  } catch {
    return { ...DEFAULT_SETTINGS, lang: fallbackLang };
  }
}

export function saveSettings(storage: StorageLike | null, settings: Settings): boolean {
  if (storage === null) return false;
  try {
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

/** localStorage, or null where merely touching it throws (some private modes, blocked site data). */
export function browserStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function preferredLang(languages: readonly string[]): Lang {
  for (const l of languages) {
    const lower = l.toLowerCase();
    if (lower.startsWith('sv')) return 'sv';
    if (lower.startsWith('en')) return 'en';
  }
  return 'en';
}
