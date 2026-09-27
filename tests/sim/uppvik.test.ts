import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import { SOLID } from '@core/world/collision';
import { Harness } from './harness';
import { finishStory, talkTo } from './walk';

const solid = (h: Harness, x: number, y: number): boolean =>
  ((h.sim.screen.collision.flags[y * 40 + x] ?? 0) & SOLID) !== 0;

describe('the road north', () => {
  it('stays under the fallen pine until Önundr saws it through, after the first stone is lit', () => {
    const shut = new Harness({ preset: DEV_PRESETS.myr, screen: 'myr_deep', tile: [20, 5] });
    expect(solid(shut, 19, 2)).toBe(true);
    const h = new Harness({ preset: DEV_PRESETS.north });
    talkTo(h, 'onundr');
    finishStory(h);
    expect(h.sim.state.flags.st_road_open).toBe(true);
    h.sim.command({ t: 'warp', screen: 'myr_deep', x: 20 * 16 + 8, y: 5 * 16 + 14 });
    h.idle(2);
    expect(solid(h, 19, 2)).toBe(false);
  });
});

const town = (screen: 'upp_gate' | 'upp_int_meadhall', tile: readonly [number, number], minute: number) =>
  new Harness({
    preset: DEV_PRESETS.north,
    screen,
    tile,
    minute,
    facing: 'n',
  });

describe('Uppvík', () => {
  it('marks Uppvík reached with a card when Ask first walks up to the gate', () => {
    const h = town('upp_gate', [19, 19], 12 * 60);
    h.hold(['up'], 50);
    expect(h.sim.state.flags.st_uppvik_reached).toBe(true);
    expect(h.sim.storyUi()).toMatchObject({ k: 'card' });
    finishStory(h);
  });

  it('shuts its gate at night; knocking lets Ask in, and out again', () => {
    const day = town('upp_gate', [19, 14], 12 * 60);
    expect(solid(day, 19, 12)).toBe(false);
    const h = town('upp_gate', [19, 14], 23 * 60);
    h.sim.state.flags.st_uppvik_reached = true;
    expect(solid(h, 19, 12)).toBe(true);
    h.press(['interact']);
    finishStory(h);
    expect(Math.floor((h.sim.hero.pos.y - 1) / 16)).toBe(10);
    h.sim.hero.facing = 's';
    h.press(['interact']);
    finishStory(h);
    expect(Math.floor((h.sim.hero.pos.y - 1) / 16)).toBe(14);
  });

  it('lets Ask sleep on the mead-hall benches till morning, healed, and offers the slots', () => {
    const h = town('upp_int_meadhall', [10, 7], 22 * 60);
    h.sim.hero.facing = 'w';
    h.sim.hero.hp = 2;
    const day = h.sim.state.clock.day;
    h.press(['interact']);
    for (let i = 0; i < 400 && h.sim.storyUi()?.k !== 'save'; i++) h.step(h.frame([])).press(['confirm']);
    expect(h.sim.storyUi()).toEqual({ k: 'save' });
    expect(h.sim.hero.hp).toBe(h.sim.hero.maxHp);
    expect(h.sim.state.clock.day).toBe(day + 1);
    expect(h.sim.state.clock.minute).toBe(6 * 60);
    h.sim.command({ t: 'saved' });
    finishStory(h);
    expect(h.sim.mode).toBe('play');
  });
});
