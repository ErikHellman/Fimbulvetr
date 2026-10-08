import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import type { Season } from '@core/clock/types';
import { Harness, frameOf } from './harness';
import { crossTo, face, finishStory, heroTile, walkTo } from './walk';

/** On Bárðr's landing with the pass open, in `season`, with `silver` in the purse. */
function atTheFerry(season: Season, silver = 40): Harness {
  const h = new Harness({ preset: DEV_PRESETS.fimbul, screen: 'myl_ferry', tile: [20, 8], season });
  h.sim.state.flags.st_pass_open = true;
  h.sim.state.flags.n_bardr_met = true;
  h.sim.state.hero.silver = silver;
  return h;
}

/** Steps onto the jetty beside the boat and puts a hand on it; the story runs, taking the first choice. */
function boardTheBoat(h: Harness): Harness {
  walkTo(h, 20, 5);
  face(h, 'e');
  h.step(frameOf([], ['interact']));
  expect(h.sim.mode).toBe('story');
  return finishStory(h);
}

describe('Bárðr’s ferry', () => {
  it('rows Ask over to the far landing for ten silver once the pass is open', () => {
    const h = atTheFerry('summer');
    boardTheBoat(h);
    expect(h.sim.screen.id).toBe('sae_landing');
    expect(h.sim.state.hero.silver).toBe(30);
    expect(h.sim.state.flags.ev_ferry).toBe(false);
  });

  it('rows Ask back from the end of the far jetty, for nothing', () => {
    const h = atTheFerry('autumn');
    boardTheBoat(h);
    walkTo(h, 16, 10);
    face(h, 'w');
    h.step(frameOf([], ['interact']));
    finishStory(h);
    expect(h.sim.screen.id).toBe('myl_ferry');
    expect(h.sim.state.hero.silver).toBe(30);
  });

  it('does not row before the pass opens, for an empty purse, or over the ice', () => {
    const shut = atTheFerry('summer');
    shut.sim.state.flags.st_pass_open = false;
    boardTheBoat(shut);
    expect(shut.sim.screen.id).toBe('myl_ferry');
    const poor = atTheFerry('spring', 6);
    boardTheBoat(poor);
    expect([poor.sim.screen.id, poor.sim.state.hero.silver]).toEqual(['myl_ferry', 6]);
    const ice = atTheFerry('winter');
    boardTheBoat(ice);
    expect([ice.sim.screen.id, ice.sim.state.hero.silver]).toEqual(['myl_ferry', 40]);
  });
});

describe('the south of Sævatn', () => {
  it('is walked over the ice in winter, from the ferry landing past the drowned village to the wreck', () => {
    const h = atTheFerry('winter');
    walkTo(h, 12, 7);
    walkTo(h, 12, 0);
    crossTo(h, 'n', 'sae_landing');
    walkTo(h, 20, 1);
    crossTo(h, 'n', 'sae_open');
    walkTo(h, 1, 10);
    crossTo(h, 'w', 'sae_skerries');
    walkTo(h, 20, 1);
    crossTo(h, 'n', 'sae_drowned');
    walkTo(h, 30, 1);
    crossTo(h, 'n', 'sae_wreck');
    walkTo(h, 20, 11);
    expect(h.sim.screen.id).toBe('sae_wreck');
  });

  it('keeps Holmr behind its warm water even in winter, without the seal-skin', () => {
    const h = new Harness({
      preset: DEV_PRESETS.fimbul,
      screen: 'sae_holmr_ford',
      tile: [20, 15],
      season: 'winter',
    });
    expect(() => walkTo(h, 20, 3, 600)).toThrow();
    h.sim.state.inv.items.sealskin = 1;
    walkTo(h, 20, 3);
    expect(heroTile(h.sim)).toEqual([20, 3]);
  });

  it('is swum with the seal-skin in summer: the reed-bank, the skerries and a heart piece off the bottom', () => {
    const h = atTheFerry('summer');
    h.sim.state.inv.items.sealskin = 1;
    walkTo(h, 10, 0);
    crossTo(h, 'n', 'sae_landing');
    walkTo(h, 20, 1);
    crossTo(h, 'n', 'sae_open');
    walkTo(h, 38, 10);
    crossTo(h, 'e', 'sae_reedbank');
    walkTo(h, 27, 10);
    walkTo(h, 1, 10);
    crossTo(h, 'w', 'sae_open');
    walkTo(h, 1, 10);
    crossTo(h, 'w', 'sae_skerries');
    walkTo(h, 20, 11);
    h.step(frameOf([], ['roll'])).idle(4);
    expect(h.sim.state.world.pieces).toContain('hp_sae_skerries');
  });
});
