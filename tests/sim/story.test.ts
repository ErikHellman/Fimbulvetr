import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';

const SIGN = { en: 'Askdalr. Mind the sheep.', sv: 'Askdalr. Akta fåren.' };
const WIDE = { en: 'The well. Two tiles wide.', sv: 'Brunnen. Två rutor bred.' };

function storyDb(): ContentDb {
  const things: Thing[] = [
    { k: 'sign', at: { x: 12, y: 8 }, text: SIGN },
    { k: 'sign', at: { x: 14, y: 8 }, w: 2, h: 2, text: WIDE },
    { k: 'use', at: { x: 16, y: 8 }, script: 'dev_script' },
    {
      k: 'trigger',
      at: { x: 4, y: 15 },
      w: 2,
      h: 2,
      script: 'dev_script',
      when: { k: 'flag', id: 'st_intro_seen', eq: false },
    },
  ];
  return {
    ...DB,
    screens: { ...DB.screens, test_a: { ...DB.screens.test_a, things } },
    scripts: {
      dev_script: {
        steps: [
          { k: 'fade', out: true },
          {
            k: 'do',
            effects: [
              { k: 'set', flag: 'st_intro_seen', value: true },
              { k: 'sleep', until: 6 * 60 },
            ],
          },
          { k: 'card', text: { en: 'Day 2', sv: 'Dag 2' } },
          { k: 'fade', out: false },
          {
            k: 'if',
            when: { k: 'flag', id: 'st_intro_seen' },
            then: [{ k: 'face', actor: 'hero', dir: 'w' }],
            else: [{ k: 'face', actor: 'hero', dir: 'e' }],
          },
        ],
      },
    },
  };
}

/** Presses confirm until the script ends. */
function finish(h: Harness): Harness {
  for (let i = 0; i < 40 && h.sim.mode === 'story'; i++) h.press(['confirm']).idle(3);
  return h;
}

describe('signs', () => {
  it('open a text box on interact, pause the clock and autosave after closing', () => {
    const h = new Harness({ db: storyDb(), tile: [12, 9], facing: 'n' });
    h.press(['interact']);
    expect(h.sim.mode).toBe('story');
    const clock = { ...h.sim.state.clock };
    h.idle(100);
    expect(h.sim.state.clock).toEqual(clock);
    expect(h.sim.storyUi()).toMatchObject({ k: 'text', who: null, text: SIGN, shown: 1 });
    expect(h.count('autosave')).toBe(0);
    h.press(['confirm']);
    expect(h.sim.mode).toBe('play');
    expect(h.sim.storyUi()).toBeNull();
    expect(h.count('autosave')).toBe(1);
  });

  it('are ignored when the hero faces away', () => {
    const h = new Harness({ db: storyDb(), tile: [12, 9], facing: 's' });
    h.press(['interact']);
    expect(h.sim.mode).toBe('play');
  });

  it('are read from any tile along a wider block', () => {
    const h = new Harness({ db: storyDb(), tile: [15, 10], facing: 'n' });
    h.press(['interact']);
    expect(h.sim.storyUi()).toMatchObject({ k: 'text', text: WIDE });
    const far = new Harness({ db: storyDb(), tile: [12, 10], facing: 'n' });
    far.press(['interact']);
    expect(far.sim.mode).toBe('play');
  });
});

describe('scripts', () => {
  it('run fades, effects, cards and branches in order', () => {
    const h = new Harness({ db: storyDb(), tile: [16, 9], facing: 'n', minute: 21 * 60 });
    const day = h.sim.state.clock.day;
    h.press(['interact']);
    h.until((s) => s.fade() === 1, 30);
    h.until((s) => s.storyUi()?.k === 'card', 30);
    expect(h.sim.state.flags.st_intro_seen).toBe(true);
    expect(h.sim.state.clock).toMatchObject({ day: day + 1, minute: 6 * 60 });
    finish(h);
    expect(h.sim.mode).toBe('play');
    expect(h.sim.fade()).toBe(0);
    expect(h.sim.hero.facing).toBe('w');
  });

  it('start from triggers only while their condition holds', () => {
    const h = new Harness({ db: storyDb(), tile: [7, 16] });
    h.until((s) => s.mode === 'story', 60, h.frame(['left']));
    finish(h);
    h.hold(['right'], 30).hold(['left'], 30);
    expect(h.sim.mode).toBe('play');
  });

  it('replay identically', () => {
    const run = (): number => {
      const h = new Harness({ db: storyDb(), tile: [16, 9], facing: 'n' });
      h.press(['interact']).idle(20);
      finish(h).hold(['down'], 20);
      return h.sim.hash();
    };
    expect(run()).toBe(run());
  });
});
