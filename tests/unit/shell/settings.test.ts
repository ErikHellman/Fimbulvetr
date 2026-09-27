import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  SETTINGS_KEY,
  loadSettings,
  parseSettings,
  preferredLang,
  saveSettings,
  type StorageLike,
} from '@shell/platform/settings';

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

const throwing: StorageLike = {
  getItem: () => {
    throw new Error('SecurityError');
  },
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
};

describe('settings', () => {
  it('uses defaults (with the preferred language) when nothing is stored', () => {
    expect(parseSettings(null, 'sv')).toEqual({ ...DEFAULT_SETTINGS, lang: 'sv' });
  });

  it('survives corrupt JSON and non-objects', () => {
    expect(parseSettings('{oops', 'en')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('42', 'en')).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps valid fields and replaces invalid ones', () => {
    const s = parseSettings(
      JSON.stringify({ lang: 'sv', volume: 7, scaling: 'fit', shake: 'yes', textSize: 3 }),
      'en',
    );
    expect(s).toMatchObject({
      lang: 'sv',
      volume: DEFAULT_SETTINGS.volume,
      scaling: 'fit',
      shake: true,
      textSize: 3,
    });
  });

  it('round-trips through storage', () => {
    const storage = memoryStorage();
    const s = { ...DEFAULT_SETTINGS, lang: 'sv' as const, longDay: true };
    expect(saveSettings(storage, s)).toBe(true);
    expect(storage.data[SETTINGS_KEY]).toBeDefined();
    expect(loadSettings(storage, 'en')).toEqual(s);
  });

  it('falls back to defaults when storage throws (private mode, blocked site data)', () => {
    expect(loadSettings(throwing, 'en')).toEqual(DEFAULT_SETTINGS);
    expect(saveSettings(throwing, DEFAULT_SETTINGS)).toBe(false);
    expect(loadSettings(null, 'sv').lang).toBe('sv');
  });

  it('prefers the first supported browser language', () => {
    expect(preferredLang(['sv-SE', 'en'])).toBe('sv');
    expect(preferredLang(['en-US', 'sv'])).toBe('en');
    expect(preferredLang(['de-DE'])).toBe('en');
  });
});

describe('settings: colour-blind and keys', () => {
  it('keeps colour-blind mode and valid key overrides, dropping bad ones', () => {
    const s = parseSettings(
      JSON.stringify({
        colourBlind: true,
        keys: { sword: ['KeyU'], roll: 'Space', nope: ['KeyX'], item1: ['Key K!'], galdr: [] },
      }),
      'en',
    );
    expect(s.colourBlind).toBe(true);
    expect(s.keys).toEqual({ sword: ['KeyU'] });
    expect(parseSettings(null, 'en')).toMatchObject({ colourBlind: false, keys: {} });
  });
});
