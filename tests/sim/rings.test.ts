import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import { MAX_SEIDR } from '@core/story/effects';
import { tileFeet } from '@core/world/screen';
import { Harness, frameOf } from './harness';
import { buyInShop } from './walk';

const plain = () => new Harness({ tile: [10, 10], facing: 'e' });

/** Ticks from the end of one roll until the next one starts, rolling as soon as Ask can. */
function rollGap(h: Harness): number {
  h.step(frameOf(['right', 'roll'], ['roll']));
  h.until((s) => s.hero.fsm.s === 'move', 60, frameOf(['right']));
  let gap = 0;
  for (; gap < 60 && h.sim.hero.fsm.s !== 'roll'; gap++) h.step(frameOf(['left', 'roll'], ['roll']));
  return gap;
}

describe('arm-rings', () => {
  it('are worn only once owned, one at a time', () => {
    const h = plain();
    h.sim.command({ t: 'ring', id: 'ring_stamina' });
    h.idle(1);
    expect(h.sim.state.inv.ring).toBeNull();
    Object.assign(h.sim.state.flags, { w_ring_stamina: true, w_ring_thrift: true });
    h.sim.command({ t: 'ring', id: 'ring_stamina' });
    h.idle(1);
    expect(h.sim.state.inv.ring).toBe('ring_stamina');
    h.sim.command({ t: 'ring', id: 'ring_thrift' });
    h.idle(1);
    expect(h.sim.state.inv.ring).toBe('ring_thrift');
    h.sim.command({ t: 'ring', id: null });
    h.idle(1);
    expect(h.sim.state.inv.ring).toBeNull();
  });

  it('of stamina halves the wait between rolls', () => {
    const bare = rollGap(plain());
    const h = plain();
    h.sim.state.flags.w_ring_stamina = true;
    h.sim.command({ t: 'ring', id: 'ring_stamina' });
    h.idle(1);
    const worn = rollGap(h);
    expect(bare).toBeGreaterThanOrEqual(DB.tuning.hero.rollCooldown);
    expect(worn).toBeLessThan(bare);
    expect(worn).toBeGreaterThanOrEqual(Math.ceil(DB.tuning.hero.rollCooldown * DB.tuning.rings.staminaRoll));
  });

  it('of thrift takes a quarter off every price, rounded up', () => {
    const h = new Harness({ preset: DEV_PRESETS.haubow });
    h.sim.state.flags.w_ring_thrift = true;
    h.sim.command({ t: 'ring', id: 'ring_thrift' });
    h.sim.state.hero.silver = 50;
    // At Sigrún's counter: flatbread, 5 silver, is the second row.
    const p = tileFeet({ x: 19, y: 12 });
    h.sim.command({ t: 'warp', screen: 'ask_int_trader', x: p.x, y: p.y });
    h.idle(2);
    h.sim.hero.facing = 'n';
    h.step(frameOf([], ['interact']));
    for (let i = 0; i < 400 && h.sim.storyUi()?.k !== 'shop'; i += 4)
      h.step(frameOf([], ['confirm'])).idle(3);
    const ui = h.sim.storyUi();
    if (ui?.k !== 'shop') throw new Error('the shop did not open');
    expect(ui.rows.map((r) => r.price)).toEqual([19, 4]);
    buyInShop(h, 1);
    expect(h.sim.state.hero.silver).toBe(46);
  });
});

describe('the seiðr vessel', () => {
  it('raises the bar by five and fills it, never past the cap', () => {
    const h = plain();
    h.sim.state.hero.maxSeidr = 10;
    h.sim.state.hero.seidr = 2;
    h.sim.command({ t: 'give', item: 'seidr_upgrade', n: 1 });
    h.idle(1);
    expect(h.sim.state.hero.maxSeidr).toBe(15);
    expect(h.sim.state.hero.seidr).toBe(15);
    h.sim.state.hero.maxSeidr = MAX_SEIDR - 2;
    h.sim.command({ t: 'give', item: 'seidr_upgrade', n: 1 });
    h.idle(1);
    expect(h.sim.state.hero.maxSeidr).toBe(MAX_SEIDR);
  });
});
