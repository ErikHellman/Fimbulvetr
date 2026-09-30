import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { FISH_DEFS } from '@content/fish';
import type { ContentDb } from '@core/sim/db';
import type { StoryUi } from '@core/sim/systems/story';
import type { Season } from '@core/clock/types';
import {
  FISHING,
  newFishRun,
  stepFishing,
  type FishDef,
  type FishPhase,
  type FishResult,
  type FishRun,
} from '@core/story/fishing';
import { EMPTY_FRAME, bit, type InputFrame } from '@core/input/actions';
import { createRng } from '@core/math/rng';
import { applyEffect } from '@core/story/effects';
import { Harness } from './harness';

/**
 * test_a opened up: a pond across rows 2–8 and a jetty `use` at (20, 9) that runs a fishing step with the
 * float out at (20, 5), counting every catch.
 */
function pondDb(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    if (y >= 2 && y <= 8) return '#' + '~'.repeat(38) + '#';
    return '#' + '.'.repeat(38) + '#';
  });
  const screen = {
    ...DB.screens.test_a,
    map,
    things: [{ k: 'use', at: { x: 20, y: 9 }, script: 'dev_script' } as const],
  };
  return {
    ...DB,
    screens: { ...DB.screens, test_a: screen },
    scripts: {
      ...DB.scripts,
      dev_script: {
        steps: [{ k: 'fish', float: { x: 20, y: 5 }, each: [{ k: 'add', flag: 'q_fish_caught', n: 1 }] }],
      },
    },
  };
}

function atThePond(season: Season = 'summer', minute = 12 * 60, seed = 1): Harness {
  const h = new Harness({ db: pondDb(), tile: [20, 10], facing: 'n', season, minute, seed });
  h.press(['interact']);
  return h;
}

/** Read through a call, so a loop's narrowing does not stick. */
const phase = (run: FishRun): FishPhase => run.phase;

type Fishing = Extract<NonNullable<StoryUi>, { k: 'fish' }>;
const ui = (h: Harness): Fishing | null => {
  const u = h.sim.storyUi();
  return u?.k === 'fish' ? u : null;
};

/** How to play the reel: hold the line (true) or let it slack. */
type Policy = (f: Fishing) => boolean;
const steady: Policy = (f) => f.tension < 700 && !f.surging;
const never: Policy = () => false;

/** Casts, strikes the bite at once, reels by `policy`, and returns how it ended. */
function fishOnce(h: Harness, policy: Policy, strikeEarly = false): FishResult | null {
  for (let i = 0; i < 4000; i++) {
    const f = ui(h);
    if (f === null) return null;
    if (f.phase === 'result' && f.result !== null) {
      const r = f.result;
      h.press(['confirm']);
      return r;
    }
    if (f.phase === 'idle') h.press(['confirm']);
    else if (f.phase === 'wait' && strikeEarly && f.t > 10) h.press(['confirm']);
    else if (f.phase === 'bite') h.press(['confirm']);
    else if (f.phase === 'reel' && policy(f)) h.hold(['confirm'], 1);
    else h.idle(1);
  }
  return null;
}

describe('fishing', () => {
  it('starts with the rod out and ends when Ask puts it down', () => {
    const h = atThePond();
    expect(h.sim.mode).toBe('story');
    expect(ui(h)?.phase).toBe('idle');
    expect(h.sim.hero.anim).toBe('fish');
    h.press(['cancel']);
    h.idle(1);
    expect(h.sim.mode).toBe('play');
    expect(h.sim.story).toBeNull();
  });

  it('spooks the fish if Ask strikes at a nibble or before the bite', () => {
    expect(fishOnce(atThePond(), steady, true)).toBe('spooked');
  });

  it('loses the fish if the bite is not struck in time', () => {
    const h = atThePond();
    h.press(['confirm']);
    h.until(() => ui(h)?.phase === 'bite', 600);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_bite' });
    h.idle(FISHING.biteTicks + 2);
    expect(ui(h)?.result).toBe('missed');
  });

  it('lands a fish played steadily: silver, and the catch counted', () => {
    const h = atThePond();
    const silver = h.sim.state.hero.silver;
    expect(fishOnce(h, steady)).toBe('landed');
    expect(h.sim.state.hero.silver).toBeGreaterThan(silver);
    expect(h.sim.state.flags.q_fish_caught).toBe(1);
  });

  it('loses a fish never reeled in', () => {
    expect(fishOnce(atThePond(), never)).toBe('slipped');
  });

  it('gives each season and part of the day its own fish', () => {
    const caught = (season: Season, minute: number): Set<string> => {
      const h = atThePond(season, minute, 7);
      const out = new Set<string>();
      for (let i = 0; i < 12; i++) {
        let fish: string | null = null;
        for (let k = 0; k < 4000 && fish === null; k++) {
          const f = ui(h);
          if (f?.phase === 'reel') fish = f.fish;
          else if (f?.phase === 'idle' || f?.phase === 'bite') h.press(['confirm']);
          else h.idle(1);
        }
        if (fish !== null) out.add(fish);
        fishOnce(h, never);
      }
      return out;
    };
    const summerNoon = caught('summer', 12 * 60);
    for (const f of summerNoon) {
      const def: FishDef = FISH_DEFS[f as keyof typeof FISH_DEFS];
      expect(def.seasons, f).toContain('summer');
      expect(def.phases ?? ['day'], f).toContain('day');
    }
    expect(summerNoon.has('gamli')).toBe(false);
    const winterNight = caught('winter', 23 * 60);
    expect([...winterNight].every((f) => f === 'perch' || f === 'burbot')).toBe(true);
  });

  it('can land Gamli, the old pike, but not by hauling blindly', () => {
    const gamli: FishDef = FISH_DEFS.gamli;
    const play = (policy: (tension: number, surging: boolean) => boolean): FishResult | null => {
      const run = newFishRun({ x: 0, y: 0 });
      let landed = false;
      const env = { rng: createRng(3), biting: [gamli], land: () => (landed = true) };
      const press: InputFrame = { ...EMPTY_FRAME, held: bit('confirm'), pressed: bit('confirm') };
      const hold: InputFrame = { ...EMPTY_FRAME, held: bit('confirm') };
      stepFishing(run, press, env);
      while (run.phase !== 'bite') stepFishing(run, EMPTY_FRAME, env);
      stepFishing(run, press, env);
      for (let i = 0; i < 5000 && phase(run) === 'reel'; i++)
        stepFishing(run, policy(run.tension, run.surgeLeft > 0) ? hold : EMPTY_FRAME, env);
      expect(landed).toBe(run.result === 'landed');
      return run.result;
    };
    expect(play((t, s) => t < 650 && !s)).toBe('landed');
    expect(play(() => true)).toBe('snapped');
    expect(play(() => false)).toBe('slipped');
  });

  it('snaps the line of a strong fish held tight all the way', () => {
    const run = newFishRun({ x: 0, y: 0 });
    const env = { rng: createRng(5), biting: [FISH_DEFS.salmon], land: () => undefined };
    const press: InputFrame = { ...EMPTY_FRAME, held: bit('confirm'), pressed: bit('confirm') };
    stepFishing(run, press, env);
    while (run.phase !== 'bite') stepFishing(run, EMPTY_FRAME, env);
    stepFishing(run, press, env);
    const hold: InputFrame = { ...EMPTY_FRAME, held: bit('confirm') };
    while (phase(run) === 'reel') stepFishing(run, hold, env);
    expect(run.result).toBe('snapped');
  });

  it('replays exactly: the same seed and presses catch the same fish', () => {
    const run = (): number => {
      const h = atThePond('autumn', 18 * 60, 11);
      for (let i = 0; i < 3; i++) fishOnce(h, steady);
      return h.sim.hash();
    };
    expect(run()).toBe(run());
  });
});

describe('a piece of heart handed over', () => {
  it('counts like one picked up, once', () => {
    const h = new Harness({ tile: [5, 5] });
    const hearts = h.sim.hero.maxHp;
    h.sim.state.world.pieces = ['a', 'b', 'c'];
    applyEffect({ k: 'piece', id: 'hp_reward' }, h.sim);
    applyEffect({ k: 'piece', id: 'hp_reward' }, h.sim);
    h.idle(1);
    expect(h.sim.state.world.pieces).toEqual(['a', 'b', 'c', 'hp_reward']);
    expect(h.sim.hero.maxHp).toBe(hearts + 4);
    expect(h.events).toContainEqual({ t: 'itemGet', item: 'heart_piece' });
  });
});
