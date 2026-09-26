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
};

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);

/** Stored JSON merged over validated defaults; anything unusable falls back field by field. */
export function parseSettings(raw: string | null, fallbackLang: Lang): Settings {
  const base: Settings = { ...DEFAULT_SETTINGS, lang: fallbackLang };
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
