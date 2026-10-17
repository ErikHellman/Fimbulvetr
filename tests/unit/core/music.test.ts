import { describe, expect, it } from 'vitest';
import { MUSIC, MUSIC_RULES } from '@content/music';
import { chooseMusic, type MusicScene } from '@core/audio/music';

const field: MusicScene = {
  screen: 'ask_field',
  region: 'askdalr',
  season: 'summer',
  night: false,
  outdoors: true,
  boss: null,
  threat: false,
  credits: false,
};

describe('chooseMusic', () => {
  it('plays the region theme outdoors, and its winter variant in winter', () => {
    expect(chooseMusic(field, MUSIC_RULES)).toEqual({ track: 'music_askdalr', combat: false, night: false });
    expect(chooseMusic({ ...field, season: 'winter' }, MUSIC_RULES).track).toBe('music_askdalr_winter');
  });

  it('adds the night drone outdoors at night, and the drums when a foe is near', () => {
    expect(chooseMusic({ ...field, night: true, threat: true }, MUSIC_RULES)).toEqual({
      track: 'music_askdalr',
      combat: true,
      night: true,
    });
    expect(chooseMusic({ ...field, night: true, outdoors: false }, MUSIC_RULES).night).toBe(false);
  });

  it('plays the town theme in the villages', () => {
    expect(chooseMusic({ ...field, screen: 'ask_village' }, MUSIC_RULES).track).toBe('music_town');
    expect(chooseMusic({ ...field, screen: 'upp_int_meadhall', region: 'myrkvidr' }, MUSIC_RULES).track).toBe(
      'music_town',
    );
  });

  it('plays a dungeon its own theme, with no night and no winter', () => {
    const d = { ...field, dungeon: 'd3' as const, season: 'winter' as const, night: true, outdoors: false };
    expect(chooseMusic(d, MUSIC_RULES)).toEqual({ track: 'music_d3', combat: false, night: false });
  });

  it('plays the boss theme for a boss, the last battle for the Rime King, and keeps mini-bosses in the dungeon', () => {
    const d = { ...field, dungeon: 'd2' as const, outdoors: false };
    expect(chooseMusic({ ...d, boss: { id: 'nykr', mini: false } }, MUSIC_RULES).track).toBe('music_boss');
    expect(chooseMusic({ ...d, boss: { id: 'hrimnir', mini: false } }, MUSIC_RULES).track).toBe(
      'music_final',
    );
    expect(chooseMusic({ ...d, boss: { id: 'hronn', mini: true } }, MUSIC_RULES)).toEqual({
      track: 'music_d2',
      combat: true,
      night: false,
    });
  });

  it('rolls the credits over everything', () => {
    expect(
      chooseMusic({ ...field, credits: true, boss: { id: 'nykr', mini: false } }, MUSIC_RULES).track,
    ).toBe('music_credits');
  });

  it('only names tracks that exist, and every town screen is a real screen', () => {
    for (const region of ['askdalr', 'hrimfjoll'] as const)
      for (const season of ['summer', 'winter'] as const)
        expect(MUSIC).toContain(chooseMusic({ ...field, region, season }, MUSIC_RULES).track);
  });
});
