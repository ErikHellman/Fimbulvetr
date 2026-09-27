import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import { NEW_GAME } from '@content/start';
import { SCREEN_IDS } from '@content/world/screens';
import { applyDevQuery, applyPreset, parseClockTime, parseDevQuery } from '@core/dev/query';
import { newGame } from '@core/state/gameState';

const known = new Set<string>(SCREEN_IDS);

describe('parseDevQuery', () => {
  it('reads every supported parameter', () => {
    const q = parseDevQuery(
      '?screen=test_b&at=20,11&season=winter&time=22:30&seed=42&lang=sv&nosave&mute',
      known,
    );
    expect(q).toMatchObject({
      screen: 'test_b',
      tile: [20, 11],
      season: 'winter',
      minute: 22 * 60 + 30,
      seed: 42,
      lang: 'sv',
      nosave: true,
      mute: true,
    });
    expect(q.warnings).toEqual([]);
  });

  it('ignores bad values with a warning instead of failing', () => {
    const q = parseDevQuery(
      'screen=nowhere&at=a,b&season=monsoon&time=25:00&seed=-1&lang=de&x=%E0%A4%A',
      known,
    );
    expect(q.screen).toBeUndefined();
    expect(q.tile).toBeUndefined();
    expect(q.season).toBeUndefined();
    expect(q.minute).toBeUndefined();
    expect(q.seed).toBeUndefined();
    expect(q.lang).toBeUndefined();
    expect(q.warnings.length).toBeGreaterThanOrEqual(6);
  });

  it('reads the weather override and the rolled switch', () => {
    const q = parseDevQuery('weather=fog&rolled=0', known);
    expect(q.weather).toBe('fog');
    expect(q.rolled).toBe(false);
    expect(parseDevQuery('', known).rolled).toBe(true);
    const bad = parseDevQuery('weather=hail&rolled=maybe', known);
    expect(bad.weather).toBeUndefined();
    expect(bad.rolled).toBe(true);
    expect(bad.warnings).toHaveLength(2);
  });

  it('reads the title switch', () => {
    expect(parseDevQuery('title=0', known).title).toBe(false);
    expect(parseDevQuery('title=1', known).title).toBe(true);
    expect(parseDevQuery('', known).title).toBeUndefined();
    expect(parseDevQuery('title=maybe', known).warnings).toHaveLength(1);
  });

  it('parses clock times', () => {
    expect(parseClockTime('day')).toBe(720);
    expect(parseClockTime('night')).toBe(0);
    expect(parseClockTime('7:05')).toBe(425);
    expect(parseClockTime('24:00')).toBeNull();
  });
});

describe('applyDevQuery', () => {
  it('moves the hero and sets the clock', () => {
    const s = newGame(1, NEW_GAME);
    applyDevQuery(s, parseDevQuery('screen=test_c&at=20,5&season=autumn&time=night', known));
    expect(s.hero).toMatchObject({ screen: 'test_c', x: 328, y: 94 });
    expect(s.clock).toMatchObject({ season: 'autumn', minute: 0, epoch: 1 });
    expect(s.world.visited).toContain('test_c');
  });
});

describe('presets', () => {
  it('parses a known preset and the gallery view, warns on unknown ones', () => {
    const q = parseDevQuery('preset=m0&dev=gallery', known, new Set(Object.keys(DEV_PRESETS)));
    expect(q.preset).toBe('m0');
    expect(q.gallery).toBe(true);
    const bad = parseDevQuery('preset=nope&dev=zoo', known, new Set(Object.keys(DEV_PRESETS)));
    expect(bad.preset).toBeUndefined();
    expect(bad.gallery).toBe(false);
    expect(bad.warnings).toHaveLength(2);
  });

  it('applies the kit, flags and place of a preset', () => {
    const state = newGame(1, NEW_GAME);
    applyPreset(state, {
      screen: 'test_b',
      tile: [3, 4],
      weapon: 'pitchfork',
      shield: false,
      flags: { st_intro_seen: true },
      minute: 20 * 60,
      silver: 7,
      items: { flatbread: 2 },
    });
    expect(state.hero.screen).toBe('test_b');
    expect(state.inv.weapon).toBe('pitchfork');
    expect(state.inv.shield).toBe(false);
    expect(state.flags.st_intro_seen).toBe(true);
    expect(state.clock.minute).toBe(20 * 60);
    expect(state.hero.silver).toBe(7);
    expect(state.inv.items.flatbread).toBe(2);
  });

  it('applies the season, clock policy, health, slots and world progress of a preset', () => {
    const state = newGame(1, NEW_GAME);
    applyPreset(state, {
      screen: 'test_a',
      tile: [3, 4],
      weapon: 'seax',
      shield: true,
      season: 'autumn',
      policy: 'cycling',
      maxHp: 16,
      hp: 20,
      slots: ['lantern', null],
      items: { lantern: 1 },
      pieces: ['hp_ask_ridge'],
      opened: ['d1_c_map'],
      dungeons: { d1: { keys: 2, map: true } },
    });
    expect(state.clock.season).toBe('autumn');
    expect(state.clock.epoch).toBe(1);
    expect(state.clock.policy).toBe('cycling');
    expect(state.hero.maxHp).toBe(16);
    expect(state.hero.hp).toBe(16);
    expect(state.inv.slots).toEqual(['lantern', null]);
    expect(state.world.pieces).toEqual(['hp_ask_ridge']);
    expect(state.world.opened).toEqual(['d1_c_map']);
    expect(state.dungeons.d1).toMatchObject({ keys: 2, map: true, compass: false, doors: [] });
    expect(state.dungeons.d2.keys).toBe(0);
  });

  it('every dev preset starts on a known screen', () => {
    for (const p of Object.values(DEV_PRESETS)) expect(SCREEN_IDS).toContain(p.screen);
  });
});
