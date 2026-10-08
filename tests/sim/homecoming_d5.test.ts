import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import type { ScreenId } from '@content/world/screens';
import { tileFeet } from '@core/world/screen';
import { Harness, frameOf } from './harness';
import { buyInShop, face, finishStory, interactNorth, walkTo } from './walk';

function warp(h: Harness, screen: ScreenId, x: number, y: number): Harness {
  const p = tileFeet({ x, y });
  h.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
  return h.idle(2);
}

/** A summer noon after Sökkva Hof: Oddr and Hallbera freed and home. */
function home(): Harness {
  const h = new Harness({ preset: DEV_PRESETS.sae });
  Object.assign(h.sim.state.flags, {
    st_thane_nykr: true,
    st_freed_oddr: true,
    st_freed_hallbera: true,
  });
  h.sim.state.clock.season = 'summer';
  return h;
}

const npcOn = (h: Harness, id: string): boolean => h.sim.actors.some((a) => a.kind === 'npc' && a.def === id);
const sceneryOf = (h: Harness, art: string) =>
  h.sim.actors.filter((a) => a.kind === 'fixture' && a.art === art);

describe('the captives held in Sökkva Hof', () => {
  it('sit in their cells until Nykr falls, and are not at home', () => {
    const h = new Harness({ preset: DEV_PRESETS.sae });
    warp(h, 'd5_r18', 20, 10);
    expect(npcOn(h, 'oddr')).toBe(true);
    warp(h, 'd5_r21', 20, 12);
    expect(npcOn(h, 'hallbera')).toBe(true);
    warp(h, 'ask_village', 20, 10);
    expect(npcOn(h, 'hallbera')).toBe(false);
  });

  it('talk through the bars', () => {
    const h = new Harness({ preset: DEV_PRESETS.sae });
    warp(h, 'd5_r18', 20, 10);
    walkTo(h, 25, 10);
    face(h, 'e');
    h.step(frameOf([], ['interact'])).idle(1);
    expect(h.sim.mode).toBe('story');
    const ui = h.sim.storyUi();
    expect(ui?.k === 'text' ? ui.text.en : '').toMatch(/HORSE/);
    finishStory(h);
  });
});

describe('Oddr and Hallbera home', () => {
  it('Hallbera sells red mead at her door by day, and her boards are down', () => {
    const h = home();
    warp(h, 'ask_village', 31, 9);
    expect(npcOn(h, 'hallbera')).toBe(true);
    // Empty horns to fill.
    Object.assign(h.sim.state.inv.items, { mead_red: 0, mead_green: 0, mead_blue: 0 });
    const silver = h.sim.state.hero.silver;
    interactNorth(h, 31, 7);
    buyInShop(h, 0);
    expect(h.sim.state.inv.items.mead_red).toBe(1);
    expect(h.sim.state.hero.silver).toBe(silver - 20);
    expect(sceneryOf(h, 'fix_boards').some((b) => b.mem['tx'] === 31 && b.mem['ty'] === 5)).toBe(false);
  });

  it('Oddr’s skiff lies at Bárðr’s landing and rows to Sævatn’s near landing', () => {
    const h = home();
    warp(h, 'myl_ferry', 12, 8);
    expect(sceneryOf(h, 'fix_skiff')).toHaveLength(3);
    interactNorth(h, 12, 6);
    finishStory(h);
    h.until((s) => s.screen.id === 'sae_landing' && s.mode === 'play', 400);
  });

  it('leaves no skiff before Oddr is home', () => {
    const h = new Harness({ preset: DEV_PRESETS.sae });
    warp(h, 'myl_ferry', 12, 8);
    expect(sceneryOf(h, 'fix_skiff')).toHaveLength(0);
  });
});
