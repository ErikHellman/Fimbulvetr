import { describe, expect, it } from 'vitest';
import { createRng } from '@core/math/rng';
import { rollDrop } from '@core/combat/drops';
import { createDrop } from '@core/sim/systems/pickups';
import { applyEffect } from '@core/story/effects';
import { Harness } from './harness';

const bag = (h: Harness) => h.sim.state.inv.items;

describe('the purse', () => {
  it('grows from 100 to 300 to 999 silver', () => {
    const h = new Harness();
    h.sim.state.hero.silver = 100;
    applyEffect({ k: 'silver', n: 50 }, h.sim);
    expect(h.sim.state.hero.silver).toBe(100);
    applyEffect({ k: 'give', item: 'purse' }, h.sim);
    expect(h.sim.state.hero.purse).toBe(1);
    applyEffect({ k: 'silver', n: 500 }, h.sim);
    expect(h.sim.state.hero.silver).toBe(300);
    applyEffect({ k: 'give', item: 'purse' }, h.sim);
    applyEffect({ k: 'give', item: 'purse' }, h.sim);
    expect(h.sim.state.hero.purse).toBe(2);
  });
});

describe('seiðr', () => {
  it('fills and adds with the seiðr effect, capped at the bar', () => {
    const h = new Harness();
    h.sim.state.hero.seidr = 2;
    applyEffect({ k: 'seidr', n: 3 }, h.sim);
    expect(h.sim.state.hero.seidr).toBe(5);
    applyEffect({ k: 'seidr', n: 0 }, h.sim);
    expect(h.sim.state.hero.seidr).toBe(10);
    applyEffect({ k: 'seidr', n: 50 }, h.sim);
    expect(h.sim.state.hero.seidr).toBe(10);
  });

  it('grows the bar by a vessel, up to 30, and fills it', () => {
    const h = new Harness();
    h.sim.state.hero.seidr = 1;
    applyEffect({ k: 'give', item: 'seidr_upgrade' }, h.sim);
    expect(h.sim.state.hero).toMatchObject({ maxSeidr: 15, seidr: 15 });
    for (let i = 0; i < 5; i++) applyEffect({ k: 'give', item: 'seidr_upgrade' }, h.sim);
    expect(h.sim.state.hero.maxSeidr).toBe(30);
  });

  it('comes back from seiðr jars dropped by foes', () => {
    const h = new Harness({ tile: [10, 10] });
    h.sim.state.hero.seidr = 3;
    h.sim.actors.push(createDrop(h.sim.newId(), 'seidr', { ...h.sim.hero.pos }));
    h.idle(2);
    expect(h.sim.state.hero.seidr).toBe(5);
  });

  it('adds jars to drop tables without changing the draws of tables that have none', () => {
    const table = { heart: 2, silver: 3, none: 5 };
    const a = createRng(9);
    const b = createRng(9);
    for (let i = 0; i < 200; i++) expect(rollDrop(a, table)).toBe(rollDrop(b, { ...table, seidr: 0 }));
    const c = createRng(3);
    const kinds = new Set(
      Array.from({ length: 200 }, () => rollDrop(c, { heart: 1, silver: 1, seidr: 2, none: 1 })),
    );
    expect(kinds.has('seidr')).toBe(true);
  });
});

describe('mead', () => {
  it('needs an empty horn: one mead per horn, whatever the colour', () => {
    const h = new Harness();
    applyEffect({ k: 'give', item: 'mead_red' }, h.sim);
    expect(bag(h).mead_red ?? 0).toBe(0);
    applyEffect({ k: 'give', item: 'horn' }, h.sim);
    applyEffect({ k: 'give', item: 'mead_red', n: 3 }, h.sim);
    expect(bag(h).mead_red).toBe(1);
    applyEffect({ k: 'give', item: 'horn' }, h.sim);
    applyEffect({ k: 'give', item: 'mead_green' }, h.sim);
    applyEffect({ k: 'give', item: 'mead_blue' }, h.sim);
    expect(bag(h)).toMatchObject({ horn: 2, mead_red: 1, mead_green: 1 });
    expect(bag(h).mead_blue ?? 0).toBe(0);
  });

  it('red heals fully, green fills the seiðr bar, blue both; none is wasted', () => {
    const h = new Harness();
    applyEffect({ k: 'give', item: 'horn', n: 3 }, h.sim);
    for (const m of ['mead_red', 'mead_green', 'mead_blue'] as const)
      applyEffect({ k: 'give', item: m }, h.sim);
    h.sim.command({ t: 'eat', item: 'mead_red' });
    h.idle(1);
    expect(bag(h).mead_red).toBe(1);
    h.sim.hero.hp = 1;
    h.sim.state.hero.seidr = 1;
    h.sim.command({ t: 'eat', item: 'mead_red' });
    h.idle(1);
    expect(h.sim.hero.hp).toBe(h.sim.hero.maxHp);
    expect(bag(h).mead_red ?? 0).toBe(0);
    h.sim.command({ t: 'eat', item: 'mead_green' });
    h.idle(1);
    expect(h.sim.state.hero.seidr).toBe(10);
    h.sim.hero.hp = 1;
    h.sim.state.hero.seidr = 1;
    h.sim.command({ t: 'eat', item: 'mead_blue' });
    h.idle(1);
    expect(h.sim.hero.hp).toBe(h.sim.hero.maxHp);
    expect(h.sim.state.hero.seidr).toBe(10);
    // The horns are empty again: three meads fit.
    applyEffect({ k: 'give', item: 'mead_red', n: 3 }, h.sim);
    expect(bag(h).mead_red).toBe(3);
  });
});
