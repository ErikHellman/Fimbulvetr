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
      textSize: 'normal',
    });
  });

  it('keeps the touch settings, and falls back field by field (older settings have none)', () => {
    const s = parseSettings(
      JSON.stringify({
        touch: 'on',
        touchSize: 'large',
        touchLeft: true,
        haptics: false,
        touchLayout: { sword: { dx: -1, dy: 0.5 }, stick: { dx: 1, dy: 0 } },
      }),
      'en',
    );
    expect(s).toMatchObject({ touch: 'on', touchSize: 'large', touchLeft: true, haptics: false });
    expect(s.touchLayout).toEqual({ sword: { dx: -1, dy: 0.5 }, stick: { dx: 1, dy: 0 } });
    const bad = parseSettings(
      JSON.stringify({
        touch: 'sometimes',
        touchSize: 9,
        touchLeft: 'no',
        touchLayout: { sword: { dx: 'x', dy: 0 }, nope: { dx: 1, dy: 1 }, roll: { dx: 99, dy: 0 } },
      }),
      'en',
    );
    expect(bad).toMatchObject({ touch: 'auto', touchSize: 'normal', touchLeft: false, haptics: true });
    expect(bad.touchLayout).toEqual({});
    expect(parseSettings(JSON.stringify({ volume: 0.5 }), 'en').touch).toBe('auto');
  });

  it('keeps a music level from 0 to 1, and falls back outside it (older settings have none)', () => {
    expect(parseSettings(JSON.stringify({ music: 0.3 }), 'en').music).toBe(0.3);
    expect(parseSettings(JSON.stringify({ music: 3 }), 'en').music).toBe(DEFAULT_SETTINGS.music);
    expect(parseSettings(JSON.stringify({ volume: 0.5 }), 'en').music).toBe(DEFAULT_SETTINGS.music);
  });

  it('reads the text size as a word; an old number falls back to normal', () => {
    expect(parseSettings(JSON.stringify({ textSize: 'larger' }), 'en').textSize).toBe('larger');
    expect(parseSettings(JSON.stringify({ textSize: 2 }), 'en').textSize).toBe('normal');
    expect(DEFAULT_SETTINGS.textSize).toBe('normal');
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

describe('settings: the introduction', () => {
  it('shows the intro unless the player turned it off, falling back on bad values', () => {
    expect(parseSettings(null, 'en').showIntro).toBe(true);
    expect(parseSettings(JSON.stringify({ showIntro: false }), 'en').showIntro).toBe(false);
    expect(parseSettings(JSON.stringify({ showIntro: 'no' }), 'en').showIntro).toBe(true);
  });
});
