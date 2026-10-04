import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import { HERD_TICKS } from '@content/scripts/lowlands';
import type { ScreenId } from '@content/world/screens';
import { tileFeet } from '@core/world/screen';
import { Harness } from './harness';
import { buyInShop, finishStory, interactNorth, talkTo } from './walk';

function warp(h: Harness, screen: ScreenId, x: number, y: number): Harness {
  const p = tileFeet({ x, y });
  h.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
  return h.idle(2);
}

/** A winter morning after Helgrind: Ulf and Tófa freed and home. */
function home(): Harness {
  const h = new Harness({ preset: DEV_PRESETS.fimbul });
  Object.assign(h.sim.state.flags, {
    st_home_winter: true,
    st_thane_nastrond: true,
    st_freed_ulf: true,
    st_freed_tofa: true,
    q_thanes: 1,
    q_captives: 2,
  });
  return h;
}

const npcOn = (h: Harness, id: string): boolean => h.sim.actors.some((a) => a.kind === 'npc' && a.def === id);
const flock = (h: Harness) => h.sim.actors.filter((a) => a.kind === 'critter' && a.mem['tag'] !== undefined);

describe('the captives held in Helgrind', () => {
  it('sit in their cells until Náströnd falls, and are not at home', () => {
    const h = new Harness({ preset: DEV_PRESETS.fimbul });
    warp(h, 'd4_r18', 20, 10);
    expect(npcOn(h, 'ulf')).toBe(true);
    warp(h, 'd4_r19', 19, 12);
    expect(npcOn(h, 'tofa')).toBe(true);
    warp(h, 'ask_pasture', 20, 10);
    expect(npcOn(h, 'ulf')).toBe(false);
  });

  it('talk through the bars', () => {
    const h = new Harness({ preset: DEV_PRESETS.fimbul });
    warp(h, 'd4_r19', 19, 12);
    interactNorth(h, 19, 6).idle(1);
    expect(h.sim.mode).toBe('story');
    const ui = h.sim.storyUi();
    expect(ui?.k === 'text' ? ui.text.en : '').toMatch(/There are trolls/);
    finishStory(h);
  });
});

describe('Ulf home', () => {
  it('is back in the pasture by day with his flock, and his herding round pays twenty silver', () => {
    const h = home();
    warp(h, 'ask_pasture', 20, 12);
    expect(npcOn(h, 'ulf')).toBe(true);
    expect(flock(h)).toHaveLength(5);
    // Reading on takes the first choice: herd the flock. The round starts with every sheep loose.
    talkTo(h, 'ulf');
    expect(h.sim.trial()?.of).toBe(HERD_TICKS);
    expect(flock(h).filter((s) => s.mem['penned'] === 1)).toHaveLength(0);
    // Shepherded in (placed straight into the fold here): the pen counts them under Ulf's own tally.
    const silver = h.sim.state.hero.silver;
    flock(h).forEach((s, i) => {
      s.pos = tileFeet({ x: 4 + i, y: 10 });
    });
    h.until((s) => s.mode === 'story', 60);
    finishStory(h);
    expect(h.sim.state.hero.silver).toBe(silver + 20);
    expect(h.sim.state.flags.ev_ulf_round).toBe(false);
    // The day-one tally is untouched, and the round can be run again.
    expect(h.sim.state.flags.q_sheep_d1).toBe(true);
    talkTo(h, 'ulf');
    expect(h.sim.trial()).not.toBeNull();
  });
});

describe('Tófa home', () => {
  it('sells flatbread over the field fence by day', () => {
    const h = home();
    warp(h, 'ask_field', 9, 18);
    expect(npcOn(h, 'tofa')).toBe(true);
    const silver = h.sim.state.hero.silver;
    const bread = h.sim.state.inv.items.flatbread ?? 0;
    interactNorth(h, 9, 16);
    buyInShop(h, 0);
    expect(h.sim.state.inv.items.flatbread).toBe(bread + 1);
    expect(h.sim.state.hero.silver).toBe(silver - 5);
  });
});
