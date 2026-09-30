import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import { coverAt } from '@core/world/cover';
import { Harness } from './harness';
import { crossTo, face, finishStory, interactNorth, talkTo, walkTo } from './walk';
import { frameOf } from './harness';

const onScreen = (h: Harness, npc: string): boolean =>
  h.sim.actors.some((a) => a.kind === 'npc' && a.def === npc);

/** From the `myl` preset down the bank path to the weir's east bank. */
function atTheWeir(): Harness {
  const h = new Harness({ preset: DEV_PRESETS.myl });
  h.idle(2);
  walkTo(h, 35, 21);
  crossTo(h, 's', 'myl_weir');
  return h;
}

/** Talks to `npc`, reading every line; returns the English text of each. */
function hear(h: Harness, npc: string): string[] {
  const who = h.sim.actors.find((a) => a.kind === 'npc' && a.def === npc);
  if (who === undefined) throw new Error(`${npc} is not here`);
  walkTo(h, Math.floor(who.pos.x / 16), Math.floor((who.pos.y - 1) / 16) + 1);
  face(h, 'n');
  h.step(frameOf([], ['interact'])).idle(1);
  const lines: string[] = [];
  for (let i = 0; i < 400 && h.sim.mode === 'story'; i++) {
    const ui = h.sim.storyUi();
    if (ui?.k === 'text' && lines.at(-1) !== ui.text.en) lines.push(ui.text.en);
    h.step(frameOf([], ['confirm'])).idle(3);
  }
  return lines;
}

describe('Önundr points the way south', () => {
  it('tells of the weir and the drowned mill once the road is open', () => {
    const h = new Harness({
      preset: DEV_PRESETS.myl,
      screen: 'myr_clearing',
      tile: [20, 12],
      minute: 12 * 60,
    });
    h.idle(2);
    expect(onScreen(h, 'onundr')).toBe(true);
    const said = hear(h, 'onundr').join(' ');
    expect(said).toContain('Mýrland');
    expect(said).toContain('latch');
  });
});

describe('the weir', () => {
  it('keeps Ask on the east bank until the boomerang strikes the latch', () => {
    const h = atTheWeir();
    walkTo(h, 29, 6);
    h.hold(['left'], 90);
    expect(h.sim.screen.id).toBe('myl_weir');
    expect(Math.floor(h.sim.hero.pos.x / 16)).toBeGreaterThanOrEqual(28);
  });

  it('drops the bridge to a boomerang thrown at the latch, and Mýrland greets Ask', () => {
    const h = atTheWeir();
    walkTo(h, 28, 4);
    face(h, 'w');
    h.press(['item1']);
    h.until(() => h.sim.state.flags.w_myl_bridge === true, 90);
    expect(h.sim.state.flags.w_myl_bridge).toBe(true);
    h.idle(30);
    walkTo(h, 22, 8);
    h.until(() => h.sim.mode === 'story', 60, frameOf(['left'])).idle(1);
    expect(h.sim.state.flags.st_myrland_reached).toBe(true);
    finishStory(h);
    walkTo(h, 5, 8);
    crossTo(h, 'w', 'myl_ford');
  });
});

describe('Mýrland’s people', () => {
  const inMyrland = (screen: string, tile: readonly [number, number], extra: object = {}) => {
    const h = new Harness({
      preset: DEV_PRESETS.fisher,
      screen: screen as 'myl_mill',
      tile,
      minute: 11 * 60,
      ...extra,
    });
    h.idle(2);
    return h;
  };

  it('Þuríðr tells of the mill and the stone beneath it (M3a’s goal)', () => {
    const h = inMyrland('myl_int_widow', [21, 13]);
    expect(onScreen(h, 'thuridr')).toBe(true);
    talkTo(h, 'thuridr');
    expect(h.sim.state.flags.q_rs2_mill).toBe(true);
    expect(h.sim.state.flags.n_thuridr_met).toBe(true);
  });

  it('Þuríðr’s spare bed heals and offers the save slots', () => {
    const h = inMyrland('myl_int_widow', [16, 9]);
    h.sim.hero.hp = 4;
    walkTo(h, 16, 8);
    face(h, 'w');
    h.step(frameOf([], ['interact']));
    h.until(() => h.sim.storyUi()?.k === 'save', 400, frameOf([], ['confirm']));
    expect(h.sim.hero.hp).toBe(h.sim.hero.maxHp);
    h.sim.command({ t: 'saved' });
    finishStory(h);
  });

  it('Kári lends his rod; before that the jetty’s rod is somebody else’s', () => {
    const h = inMyrland('myl_fisher', [20, 4]);
    delete h.sim.state.flags.n_kari_met;
    interactNorth(h, 20, 2).idle(1);
    expect(h.sim.storyUi()?.k).toBe('text');
    finishStory(h);
    walkTo(h, 23, 10);
    talkTo(h, 'kari');
    expect(h.sim.state.flags.n_kari_met).toBe(true);
    interactNorth(h, 20, 2).idle(1);
    expect(h.sim.storyUi()?.k).toBe('fish');
    h.press(['cancel']);
    h.idle(2);
    expect(h.sim.mode).toBe('play');
  });

  it('Kári gives a piece of heart for Gamli, once', () => {
    const h = inMyrland('myl_fisher', [23, 11]);
    h.sim.state.flags.q_fish_gamli = true;
    const pieces = h.sim.state.world.pieces.length;
    talkTo(h, 'kari');
    expect(h.sim.state.world.pieces).toContain('hp_myl_fisher');
    expect(h.sim.state.world.pieces.length).toBe(pieces + 1);
    expect(h.sim.state.flags.q_fisher_done).toBe(true);
    talkTo(h, 'kari');
    expect(h.sim.state.world.pieces.length).toBe(pieces + 1);
  });

  it('Kári spends his nights indoors', () => {
    const h = inMyrland('myl_fisher', [23, 11], { minute: 23 * 60 });
    expect(onScreen(h, 'kari')).toBe(false);
  });

  it('Bárðr will not row before the pass is open', () => {
    const h = inMyrland('myl_ferry', [22, 11]);
    talkTo(h, 'bardr');
    expect(h.sim.state.flags.n_bardr_met).toBe(true);
    expect(h.sim.screen.id).toBe('myl_ferry');
  });

  it('floods the shoal in spring and leaves it wadeable in summer', () => {
    const at = (season: 'spring' | 'summer') => {
      const h = new Harness({ preset: DEV_PRESETS.fisher, screen: 'myl_ford', tile: [19, 9], season });
      h.idle(2);
      return coverAt(h.sim.screen.cover, DB.coverOrder, 19, 13);
    };
    expect(at('spring')).toBe('flood');
    expect(at('summer')).toBeNull();
  });

  it('sends bog-lights over the peat at night only', () => {
    const lights = (minute: number) => {
      const h = new Harness({ preset: DEV_PRESETS.fisher, screen: 'myl_peat', tile: [20, 18], minute });
      h.idle(2);
      return h.sim.enemies.filter((e) => e.def === 'myrljos').length;
    };
    expect(lights(12 * 60)).toBe(0);
    expect(lights(23 * 60)).toBeGreaterThan(0);
  });
});
