import { describe, expect, it } from 'vitest';
import { Harness } from './harness';

describe('equip', () => {
  it('puts owned sub-items in a slot, and swaps when the item is in the other one', () => {
    const h = new Harness();
    h.sim.state.inv.items.lantern = 1;
    h.sim.state.inv.items.boomerang = 1;
    h.sim.command({ t: 'equip', slot: 1, item: 'lantern' });
    h.sim.command({ t: 'equip', slot: 0, item: 'boomerang' });
    h.sim.flushCommands();
    expect(h.sim.state.inv.slots).toEqual(['boomerang', 'lantern']);
    h.sim.command({ t: 'equip', slot: 0, item: 'lantern' });
    h.sim.flushCommands();
    expect(h.sim.state.inv.slots).toEqual(['lantern', 'boomerang']);
    h.sim.command({ t: 'equip', slot: 1, item: null });
    h.sim.flushCommands();
    expect(h.sim.state.inv.slots).toEqual(['lantern', null]);
  });

  it('refuses items not owned and items that are not for a slot', () => {
    const h = new Harness();
    h.sim.state.inv.items.flatbread = 2;
    h.sim.command({ t: 'equip', slot: 0, item: 'bombs' });
    h.sim.command({ t: 'equip', slot: 1, item: 'flatbread' });
    h.sim.flushCommands();
    expect(h.sim.state.inv.slots).toEqual([null, null]);
  });
});

describe('eat', () => {
  it('heals a heart and a half and uses one up', () => {
    const h = new Harness();
    h.sim.state.inv.items.flatbread = 2;
    h.sim.hero.hp = 2;
    h.sim.command({ t: 'eat', item: 'flatbread' });
    h.sim.flushCommands();
    expect(h.sim.hero.hp).toBe(8);
    expect(h.sim.state.hero.hp).toBe(8);
    expect(h.sim.state.inv.items.flatbread).toBe(1);
    h.sim.hero.hp = 10;
    h.sim.command({ t: 'eat', item: 'flatbread' });
    h.idle(1);
    expect(h.sim.hero.hp).toBe(12);
    expect(h.sim.state.inv.items.flatbread).toBeUndefined();
  });

  it('is refused at full health, without food, or for things that are not food', () => {
    const h = new Harness();
    h.sim.state.inv.items.cheese = 1;
    h.sim.state.inv.items.lantern = 1;
    h.sim.command({ t: 'eat', item: 'cheese' });
    h.sim.flushCommands();
    expect(h.sim.state.inv.items.cheese).toBe(1);
    h.sim.hero.hp = 4;
    h.sim.command({ t: 'eat', item: 'lantern' });
    h.sim.command({ t: 'eat', item: 'flatbread' });
    h.idle(1);
    expect(h.sim.hero.hp).toBe(4);
    expect(h.sim.state.inv.items.cheese).toBe(1);
  });
});

describe('item buttons', () => {
  it('do nothing for items without a use yet', () => {
    const h = new Harness();
    h.sim.state.inv.items.lantern = 1;
    h.sim.state.inv.slots = ['lantern', null];
    h.press(['item1']);
    expect(h.sim.hero.fsm.s).toBe('move');
    expect(h.events.filter((e) => e.t === 'sfx')).toEqual([]);
  });
});
