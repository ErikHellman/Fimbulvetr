import { FONT_SIZES, type FontSize } from '@art/font';
import { ACTIONS, type Action } from '@core/input/actions';
import { LANGS, type Lang } from '@core/i18n/t';
import type { Scaling } from '@shell/scale';
import { MOVABLE, TOUCH_SIZES, type Offsets, type TouchSize } from '@shell/input/touchLayout';

/** On-screen controls: shown after a touch until a key or button is used (auto), always, or never. */
export const TOUCH_MODES = ['auto', 'on', 'off'] as const;
export type TouchMode = (typeof TOUCH_MODES)[number];

export interface Settings {
  lang: Lang;
  /** Master volume: sound effects play at it, music at it times `music`. */
  volume: number;
  music: number;
  scaling: Scaling;
  shake: boolean;
  flash: boolean;
  holdShield: boolean;
  longDay: boolean;
  /** Dialogue, its choices and story cards; menus and the HUD stay at the normal size. */
  textSize: FontSize;
  /** Pulls reds and greens apart in the world's colours. */
  colourBlind: boolean;
  /** Shows the controls page before a new game; its "don't show this again" box turns it off. */
  showIntro: boolean;
  /** Keyboard keys per action that differ from the defaults (KeyboardEvent.code values). */
  keys: Partial<Record<Action, readonly string[]>>;
  touch: TouchMode;
  touchSize: TouchSize;
  /** The on-screen controls mirrored: buttons on the left, the stick on the right. */
  touchLeft: boolean;
  /** A short buzz when Ask is hurt (on devices that can; touch controls only). */
  haptics: boolean;
  /** On-screen controls moved in the layout editor. */
  touchLayout: Offsets;
}

export const SETTINGS_KEY = 'fimbulvetr.settings.v1';

export const DEFAULT_SETTINGS: Settings = {
  lang: 'en',
  volume: 0.7,
  music: 0.6,
  scaling: 'integer',
  shake: true,
  flash: true,
  holdShield: false,
  longDay: false,
  textSize: 'normal',
  colourBlind: false,
  showIntro: true,
  keys: {},
  touch: 'auto',
  touchSize: 'normal',
  touchLeft: false,
  haptics: true,
  touchLayout: {},
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

/** A moved control may sit at most this many button widths from home (the layout clamps it on screen). */
const MAX_OFFSET = 30;

function parseOffsets(v: unknown): Offsets {
  if (typeof v !== 'object' || v === null) return {};
  const out: Offsets = {};
  const ok = (n: unknown): n is number =>
    typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= MAX_OFFSET;
  for (const id of MOVABLE) {
    const o = (v as Record<string, unknown>)[id];
    if (typeof o !== 'object' || o === null) continue;
    const { dx, dy } = o as Record<string, unknown>;
    if (ok(dx) && ok(dy)) out[id] = { dx, dy };
  }
  return out;
}

/** Stored JSON merged over validated defaults; anything unusable falls back field by field. */
export function parseSettings(raw: string | null, fallbackLang: Lang): Settings {
  const base: Settings = { ...DEFAULT_SETTINGS, lang: fallbackLang, keys: {}, touchLayout: {} };
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
  const music =
    typeof d['music'] === 'number' && d['music'] >= 0 && d['music'] <= 1 ? d['music'] : base.music;
  const scaling = d['scaling'] === 'integer' || d['scaling'] === 'fit' ? d['scaling'] : base.scaling;
  // Before M11b it was a number that no menu set, so a stored number falls back to normal.
  const textSize = FONT_SIZES.find((f) => f === d['textSize']) ?? base.textSize;
  return {
    lang,
    volume,
    music,
    scaling,
    shake: bool(d['shake'], base.shake),
    flash: bool(d['flash'], base.flash),
    holdShield: bool(d['holdShield'], base.holdShield),
    longDay: bool(d['longDay'], base.longDay),
    textSize,
    colourBlind: bool(d['colourBlind'], base.colourBlind),
    showIntro: bool(d['showIntro'], base.showIntro),
    keys: parseKeys(d['keys']),
    touch: TOUCH_MODES.find((m) => m === d['touch']) ?? base.touch,
    touchSize: TOUCH_SIZES.find((z) => z === d['touchSize']) ?? base.touchSize,
    touchLeft: bool(d['touchLeft'], base.touchLeft),
    haptics: bool(d['haptics'], base.haptics),
    touchLayout: parseOffsets(d['touchLayout']),
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
