import { describe, expect, it } from 'vitest';
import { MUSIC_RULES } from '@content/music';
import { musicOf } from '@core/audio/music';
import { Harness } from './harness';

describe('musicOf', () => {
  it('follows the hero: the region theme by day, the drone at night, a winter variant in Hrímfjöll', () => {
    expect(musicOf(new Harness({ screen: 'ask_field', minute: 12 * 60 }).sim, MUSIC_RULES)).toEqual({
      track: 'music_askdalr',
      combat: false,
      night: false,
    });
    expect(musicOf(new Harness({ screen: 'ask_field', minute: 23 * 60 }).sim, MUSIC_RULES).night).toBe(true);
    expect(musicOf(new Harness({ screen: 'ask_village' }).sim, MUSIC_RULES).track).toBe('music_town');
    const frost = new Harness({ screen: 'hrf_towerfoot', season: 'summer' }).sim;
    expect(musicOf(frost, MUSIC_RULES).track).toBe('music_hrimfjoll_winter');
  });

  it('plays a dungeon its theme, and the drums once a foe is near', () => {
    const room = ['d1_r01', 'd1_r02', 'd1_r03', 'd1_r04', 'd1_r05', 'd1_r06'] as const;
    const h = room
      .map((screen) => new Harness({ screen }))
      .find((x) => x.sim.boss() === null && x.sim.enemies.some((e) => e.hp > 0 && e.faction === 'enemy'));
    if (h === undefined) throw new Error('no room with foes');
    h.sim.hero.pos.x = -1000;
    expect(musicOf(h.sim, MUSIC_RULES)).toEqual({ track: 'music_d1', combat: false, night: false });
    const foe = h.sim.enemies.find((e) => e.hp > 0 && e.faction === 'enemy');
    if (foe === undefined) throw new Error('no foe');
    h.sim.hero.pos.x = foe.pos.x;
    h.sim.hero.pos.y = foe.pos.y + 16;
    expect(musicOf(h.sim, MUSIC_RULES).combat).toBe(true);
  });

  it('plays the boss theme in Rótarhellir’s boss room', () => {
    expect(musicOf(new Harness({ screen: 'd1_r12' }).sim, MUSIC_RULES).track).toBe('music_boss');
  });
});
