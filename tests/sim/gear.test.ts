import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import { hurtHero } from '@core/sim/systems/combat';
import { applyEffect } from '@core/story/effects';
import { Harness } from './harness';

/** test_a opened up with the (immortal, 40 hp) training dummy two tiles east of Ask. */
function arena(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  const things = [{ k: 'enemy' as const, id: 'dummy' as const, at: { x: 12, y: 10 } }];
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

const dummy = (h: Harness) => h.sim.actors.find((a) => a.def === 'dummy');

function firstBlow(weapon: 'seax' | 'uppvik_sword'): number {
  const h = new Harness({ db: arena(), tile: [11, 10], facing: 'e' });
  h.sim.state.inv.weapon = weapon;
  const before = dummy(h)?.hp ?? 0;
  h.press(['sword']).idle(12);
  return before - (dummy(h)?.hp ?? 0);
}

describe('weapons', () => {
  it('the Uppvík sword cuts harder than the seax', () => {
    expect(firstBlow('seax')).toBe(2);
    expect(firstBlow('uppvik_sword')).toBe(3);
  });
});

describe('armour', () => {
  const blow = (armor: 'wool_tunic' | 'byrnie', amount: number): number => {
    const h = new Harness({ db: arena(), tile: [11, 10], facing: 'e' });
    h.sim.state.inv.armor = armor;
    const source = dummy(h);
    if (source === undefined) throw new Error('no dummy');
    const hp = h.sim.hero.hp;
    hurtHero(h.sim, source, amount, 0, 0);
    return hp - h.sim.hero.hp;
  };

  it('the wool tunic takes nothing off; the byrnie takes a quarter, never the whole blow', () => {
    expect(blow('wool_tunic', 4)).toBe(4);
    expect(blow('byrnie', 4)).toBe(3);
    expect(blow('byrnie', 6)).toBe(4);
    expect(blow('byrnie', 2)).toBe(1);
    expect(blow('byrnie', 1)).toBe(1);
  });
});

describe('kit effects', () => {
  it('put on armour and learn a galdr once', () => {
    const h = new Harness();
    applyEffect({ k: 'armor', id: 'byrnie' }, h.sim);
    applyEffect({ k: 'learn', galdr: 'eldr' }, h.sim);
    applyEffect({ k: 'learn', galdr: 'eldr' }, h.sim);
    expect(h.sim.state.inv.armor).toBe('byrnie');
    expect(h.sim.state.inv.galdr).toEqual(['eldr']);
  });
});
