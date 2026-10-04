import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import { questLog } from '@core/story/quests';
import { blast } from '@core/sim/systems/bombs';
import { tileFeet } from '@core/world/screen';
import { Harness, frameOf } from './harness';
import { buyInShop, face, finishStory, talkTo, walkTo } from './walk';

/** With the seal-skin, on Holmr's south shore (summer, by day), Embla not yet found. */
function onHolmr(minute = 12 * 60): Harness {
  const h = new Harness({
    preset: DEV_PRESETS.fimbul,
    screen: 'sae_holmr_ford',
    tile: [21, 3],
    season: 'summer',
    minute,
  });
  Object.assign(h.sim.state.flags, { st_rime_open: true, st_niflmyrr_reached: true, q_sealskin_done: true });
  h.sim.state.inv.items.sealskin = 1;
  return h;
}

/** In the Refuge's hall with Embla found. */
function inTheHall(minute = 12 * 60): Harness {
  const h = onHolmr(minute);
  h.sim.state.flags.st_embla_found = true;
  h.sim.command({ t: 'warp', screen: 'ref_int_hall', x: 18 * 16 + 8, y: 15 * 16 + 14 });
  h.idle(2);
  return h;
}

const quest = (h: Harness, id: string) =>
  questLog(DB.quests, { state: h.sim.state, quests: DB.quests }).find((q) => q.id === id);

const useAt = (h: Harness, x: number, y: number, dir: 'n' | 's' | 'e' | 'w'): Harness => {
  walkTo(h, x, y);
  face(h, dir);
  return h.step(frameOf([], ['interact']));
};

describe('the Refuge on Holmr', () => {
  it('finds Embla waiting on the shore the first time Ask lands', () => {
    const h = onHolmr();
    h.until((s) => s.screen.id === 'sae_holmr' && s.mode === 'story', 300, frameOf(['up']));
    finishStory(h);
    expect(h.sim.state.flags.st_embla_found).toBe(true);
    expect(quest(h, 'q_holmr')?.text.en).toMatch(/Embla/);
    walkTo(h, 18, 12);
    h.hold(['up'], 60).idle(40);
    expect(h.sim.screen.id).toBe('ref_int_hall');
  });

  it('has Embla take the comb for her sail-needle (trading step 5)', () => {
    const h = inTheHall(20 * 60);
    Object.assign(h.sim.state.flags, { q_trade: 4 });
    h.sim.state.inv.items.trade_comb = 1;
    talkTo(h, 'embla');
    expect([h.sim.state.inv.items.trade_comb ?? 0, h.sim.state.inv.items.trade_needle]).toEqual([0, 1]);
    expect(h.sim.state.flags.q_trade).toBe(5);
  });

  it('has Vala heal Ask for nothing once a day', () => {
    const h = inTheHall();
    h.sim.hero.hp = 4;
    talkTo(h, 'vala');
    expect(h.sim.hero.hp).toBe(h.sim.hero.maxHp);
    h.sim.hero.hp = 4;
    talkTo(h, 'vala');
    expect(h.sim.hero.hp).toBe(4);
    h.sim.state.flags.ev_vala_day = false;
    talkTo(h, 'vala');
    expect(h.sim.hero.hp).toBe(h.sim.hero.maxHp);
  });

  it('has Vala sell green mead for silver, and Hreggviðr blue mead for ore', () => {
    const h = inTheHall();
    h.sim.state.hero.silver = 100;
    // Mead is carried in horns: four, all empty.
    h.sim.state.inv.items.horn = 4;
    h.sim.state.inv.items.mead_red = 0;
    useAt(h, 15, 12, 'w');
    buyInShop(h, 0);
    expect(h.sim.state.inv.items.mead_green).toBeGreaterThanOrEqual(1);
    const silver = h.sim.state.hero.silver;
    expect(silver).toBeLessThan(100);
    h.sim.state.inv.items.ore = 5;
    const blue = h.sim.state.inv.items.mead_blue ?? 0;
    useAt(h, 24, 12, 'e');
    buyInShop(h, 0);
    expect(h.sim.state.inv.items.mead_blue).toBe(blue + 1);
    expect(h.sim.state.inv.items.ore).toBe(5 - (DB.shops.hreggvidr?.stock[0]?.price ?? 0));
    expect(h.sim.state.hero.silver).toBe(silver);
    expect(DB.shops.hreggvidr?.currency).toBe('ore');
  });

  it('keeps the war table: the thanes fallen and the captives freed', () => {
    const h = inTheHall();
    Object.assign(h.sim.state.flags, { st_thane_nastrond: true, st_freed_ulf: true, st_freed_tofa: true });
    useAt(h, 21, 12, 's');
    expect(h.sim.mode).toBe('story');
    const seen: string[] = [];
    for (let i = 0; i < 400 && h.sim.mode !== 'play'; i += 4) {
      const ui = h.sim.storyUi();
      if (ui?.k === 'text') seen.push(ui.text.en);
      h.step(frameOf([], ['confirm'])).idle(3);
    }
    const all = seen.join(' ');
    expect(all).toMatch(/Náströnd/);
    expect(all).toMatch(/Ulf/);
    expect(all).toMatch(/Tófa/);
    expect(all).not.toMatch(/Oddr/);
  });

  it('has a shrine that restores and keeps the record, and a warp stone outside', () => {
    const h = inTheHall();
    h.sim.hero.hp = 4;
    useAt(h, 24, 7, 'n');
    expect(h.sim.mode).toBe('story');
    for (let i = 0; i < 40 && h.sim.storyUi()?.k !== 'save'; i++) h.step(frameOf([], ['confirm'])).idle(3);
    expect(h.sim.hero.hp).toBe(h.sim.hero.maxHp);
    h.sim.command({ t: 'saved' });
    finishStory(h);
    walkTo(h, 18, 15);
    h.hold(['down'], 60).idle(40);
    expect(h.sim.screen.id).toBe('sae_holmr');
    useAt(h, 23, 10, 'n');
    finishStory(h);
    expect(h.sim.state.world.warps).toContain('saevatn');
  });
});

describe('ore', () => {
  it('comes out of the black rock on the north shallows when it is blasted', () => {
    const h = onHolmr();
    h.sim.command({ t: 'warp', screen: 'sae_north', x: 30 * 16 + 8, y: 8 * 16 + 14 });
    h.idle(2);
    blast(h.sim, tileFeet({ x: 33, y: 8 }));
    h.idle(2);
    expect(h.sim.state.world.opened).toContain('sae_k_ore1');
    walkTo(h, 33, 8);
    face(h, 'e');
    h.step(frameOf([], ['interact']));
    finishStory(h);
    expect(h.sim.state.inv.items.ore).toBe(3);
  });
});
