import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import { SOLID } from '@core/world/collision';
import { Harness } from './harness';
import { buyInShop, finishStory, interactNorth, talkTo } from './walk';

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

type TownScreen = 'upp_gate' | 'upp_int_meadhall' | 'upp_int_trader' | 'upp_smiths' | 'upp_int_hof';

const town = (screen: TownScreen, tile: readonly [number, number], minute: number) =>
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

const npcsHere = (h: Harness): string[] =>
  h.sim.actors
    .filter((a) => a.kind === 'npc')
    .map((a) => a.def)
    .sort();

describe('Uppvík folk', () => {
  it('Þórdís gives a new traveller one horn, once', () => {
    const h = town('upp_int_meadhall', [19, 12], 12 * 60);
    h.idle(2);
    talkTo(h, 'thordis');
    expect(h.sim.state.inv.items.horn).toBe(1);
    expect(h.sim.state.flags.w_horn_thordis).toBe(true);
    talkTo(h, 'thordis');
    expect(h.sim.state.inv.items.horn).toBe(1);
  });

  it('Hrafnkell sells mead across his counter by day; by night the counter is bare', () => {
    const h = town('upp_int_trader', [19, 13], 12 * 60);
    h.sim.state.inv.items.horn = 1;
    h.sim.state.hero.silver = 50;
    h.idle(2);
    interactNorth(h, 18, 9);
    expect(h.sim.mode).toBe('story');
    buyInShop(h, 0);
    expect(h.sim.state.inv.items.mead_red).toBe(1);
    expect(h.sim.state.hero.silver).toBe(30);
    const night = town('upp_int_trader', [19, 13], 23 * 60);
    night.idle(2);
    expect(npcsHere(night)).not.toContain('hrafnkell');
    interactNorth(night, 18, 9);
    expect(night.sim.mode).toBe('play');
  });

  it('Ketill sells the Uppvík sword at his anvil, and from the anvil indoors when it rains', () => {
    const h = town('upp_smiths', [14, 9], 12 * 60);
    h.sim.state.hero.silver = 100;
    h.idle(2);
    interactNorth(h, 15, 7);
    buyInShop(h, 0);
    expect(h.sim.state.inv.weapon).toBe('uppvik_sword');
    expect(h.sim.state.hero.silver).toBe(20);

    const wet = town('upp_smiths', [14, 9], 12 * 60);
    wet.sim.command({ t: 'weather', kind: 'rain' });
    wet.idle(70);
    expect(npcsHere(wet)).not.toContain('ketill');
    wet.sim.command({ t: 'warp', screen: 'upp_int_smithy', x: 21 * 16 + 8, y: 13 * 16 + 14 });
    wet.idle(2);
    expect(npcsHere(wet)).toContain('ketill');
    wet.sim.state.hero.silver = 100;
    interactNorth(wet, 21, 10);
    buyInShop(wet, 1);
    expect(wet.sim.state.inv.armor).toBe('byrnie');
  });

  it('gathers the town in the mead hall at dusk, and the outdoor folk when it rains', () => {
    const dusk = town('upp_int_meadhall', [19, 15], 19 * 60);
    dusk.idle(2);
    expect(npcsHere(dusk)).toEqual(['eyvindr', 'glumr', 'hrafnkell', 'ketill', 'ragna', 'steinn', 'thordis']);
    const noon = town('upp_int_meadhall', [19, 15], 12 * 60);
    noon.idle(2);
    expect(npcsHere(noon)).toEqual(['steinn', 'thordis']);
    noon.sim.command({ t: 'weather', kind: 'storm' });
    noon.idle(70);
    expect(npcsHere(noon)).toEqual(['eyvindr', 'ragna', 'steinn', 'thordis']);
  });

  it('prayer at the hof fills seiðr as well as health', () => {
    const h = town('upp_int_hof', [20, 10], 12 * 60);
    h.sim.state.hero.seidr = 2;
    h.sim.hero.hp = 3;
    interactNorth(h, 20, 8);
    for (let i = 0; i < 400 && h.sim.storyUi()?.k !== 'save'; i++) h.step(h.frame([])).press(['confirm']);
    expect(h.sim.state.hero.seidr).toBe(h.sim.state.hero.maxSeidr);
    expect(h.sim.hero.hp).toBe(h.sim.hero.maxHp);
    h.sim.command({ t: 'saved' });
    finishStory(h);
  });
});
