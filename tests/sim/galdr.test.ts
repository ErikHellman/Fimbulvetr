import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { TUNING } from '@content/tuning';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { coverAt } from '@core/world/cover';
import { Harness } from './harness';

/** test_a opened up: tall grass (or winter drifts) on columns 26–30, and the given things. */
function field(things: Thing[] = [], cover: '"' | '^' = '"'): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    return '#' + '.'.repeat(25) + cover.repeat(5) + '.'.repeat(8) + '#';
  });
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

function caster(db: ContentDb, season: 'summer' | 'winter' = 'summer'): Harness {
  const h = new Harness({ db, tile: [20, 10], facing: 'e', season });
  h.sim.state.inv.galdr = ['eldr'];
  return h;
}

const bolts = (h: Harness) => h.sim.actors.filter((a) => a.kind === 'projectile' && a.def === 'eldr');
const cover = (h: Harness, x: number, y: number) => coverAt(h.sim.screen.cover, DB.coverOrder, x, y);

describe('galdr', () => {
  it('does nothing before Ask knows one', () => {
    const h = new Harness({ db: field(), tile: [20, 10], facing: 'e' });
    h.press(['galdr']);
    expect(bolts(h)).toHaveLength(0);
    expect(h.sim.state.hero.seidr).toBe(10);
  });

  it('casts Eldr for two seiðr: Ask sings and a bolt of fire flies', () => {
    const h = caster(field());
    h.press(['galdr']);
    expect(h.sim.state.hero.seidr).toBe(8);
    expect(h.sim.hero.fsm.s).toBe('cast');
    expect(bolts(h)).toHaveLength(1);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_eldr' });
    h.idle(TUNING.hero.castTicks).expectAnims();
  });

  it('fizzles without enough seiðr', () => {
    const h = caster(field());
    h.sim.state.hero.seidr = 1;
    h.press(['galdr']);
    expect(bolts(h)).toHaveLength(0);
    expect(h.sim.state.hero.seidr).toBe(1);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_fizzle' });
  });

  it('sets tall grass alight where it lands', () => {
    const h = caster(field());
    h.press(['galdr']).idle(30);
    expect(h.sim.screen.cover.burning).toBeGreaterThan(0);
    expect(bolts(h)).toHaveLength(0);
  });

  it('melts a patch of drifts in winter', () => {
    const h = caster(field([], '^'), 'winter');
    expect(cover(h, 26, 10)).toBe('drift');
    h.press(['galdr']).idle(30);
    expect(cover(h, 26, 10)).toBeNull();
    expect(cover(h, 26, 9)).toBeNull();
    expect(cover(h, 26, 12)).toBe('drift');
  });

  it('burns a foe, harder when it is weak to fire, and half as hard in the rain', () => {
    const wolfAt: Thing = { k: 'enemy', id: 'vargr', at: { x: 24, y: 10 } };
    const dry = caster(field([wolfAt]));
    dry.press(['galdr']).idle(10);
    const wolf = dry.sim.actors.find((a) => a.def === 'vargr');
    expect((wolf?.maxHp ?? 0) - (wolf?.hp ?? 0)).toBe(TUNING.eldr.damage);
    const wet = caster(field([wolfAt]));
    wet.sim.command({ t: 'weather', kind: 'rain' });
    wet.idle(1).press(['galdr']).idle(10);
    const soaked = wet.sim.actors.find((a) => a.def === 'vargr');
    expect((soaked?.maxHp ?? 0) - (soaked?.hp ?? 0)).toBe(TUNING.eldr.damage / 2);
  });

  it('lights a brazier and burns away brambles', () => {
    const h = caster(field([{ k: 'brazier', at: { x: 24, y: 10 } }]));
    h.press(['galdr']).idle(10);
    expect(h.sim.actors.find((a) => a.def === 'brazier')?.anim).toBe('burn');
    const b = caster(field([{ k: 'prop', id: 'bramble', at: { x: 24, y: 10 } }]));
    b.press(['galdr']).idle(10);
    expect(b.sim.actors.some((a) => a.def === 'bramble')).toBe(false);
  });

  it('stops at a wall', () => {
    const h = caster(field());
    h.sim.hero.facing = 'w';
    h.sim.hero.pos = { x: 2 * 16 + 8, y: h.sim.hero.pos.y };
    h.press(['galdr']).idle(8);
    expect(bolts(h)).toHaveLength(0);
  });
});
