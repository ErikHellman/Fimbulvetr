import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { LOW } from '@core/world/collision';
import { hurtHero } from '@core/sim/systems/combat';
import { Harness, frameOf } from './harness';
import { heroTile } from './walk';

/**
 * Grass on cols 1–9 and 30–38 and a lake between; row 15 is a weak east-going current, row 17 a strong
 * south-going one (a surge) over cols 10–29.
 */
function lake(extra: Thing[] = []): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    const mid = y === 15 ? '>'.repeat(20) : y === 17 ? ']'.repeat(20) : '~'.repeat(20);
    return '#' + '.'.repeat(9) + mid + '.'.repeat(9) + '#';
  });
  const screen = { ...DB.screens.test_a, map, things: extra };
  return { ...DB, screens: { ...DB.screens, test_a: screen } };
}

function skin(h: Harness): Harness {
  h.sim.state.inv.items.sealskin = 1;
  return h;
}

describe('deep water', () => {
  it('stops Ask without the seal-skin', () => {
    const h = new Harness({ db: lake(), tile: [9, 10], facing: 'e' });
    h.hold(['right'], 40);
    expect(heroTile(h.sim)[0]).toBe(9);
    expect(h.sim.hero.fsm.s).toBe('move');
  });

  it('is swum with the seal-skin: slower than walking, with a splash going in', () => {
    const h = skin(new Harness({ db: lake(), tile: [9, 10], facing: 'e' }));
    h.until((s) => s.hero.fsm.s === 'swim', 40, frameOf(['right']));
    expect(h.events.some((e) => e.t === 'sfx' && e.id === 'sfx_splash')).toBe(true);
    expect(h.sim.hero.anim).toBe('swim');
    const x = h.sim.hero.pos.x;
    h.hold(['right'], 20);
    expect(h.sim.hero.pos.x - x).toBeCloseTo(DB.tuning.hero.swimSpeed * 20, 0);
    expect(DB.tuning.hero.swimSpeed).toBeCloseTo(DB.tuning.hero.walkSpeed * 0.7, 5);
  });

  it('leaves no hand free while swimming: no sword, shield or item', () => {
    const h = skin(new Harness({ db: lake(), tile: [9, 10], facing: 'e' }));
    h.until((s) => s.hero.fsm.s === 'swim', 40, frameOf(['right']));
    h.hold(['right'], 16);
    h.step(frameOf([], ['sword'])).idle(1);
    expect(h.sim.hero.fsm.s).toBe('swim');
    h.hold(['shield'], 4);
    expect(h.sim.hero.fsm.s).toBe('swim');
    h.sim.state.inv.items.boomerang = 1;
    h.sim.state.inv.slots = ['boomerang', null];
    h.step(frameOf([], ['item1'])).idle(1);
    expect(h.sim.actors.some((a) => a.kind === 'projectile')).toBe(false);
  });

  it('climbs out onto the far bank and walks on', () => {
    const h = skin(new Harness({ db: lake(), tile: [9, 10], facing: 'e' }));
    h.until((s) => heroTile(s)[0] === 31, 600, frameOf(['right']));
    expect(h.sim.hero.fsm.s).toBe('move');
  });

  it('is walked on where ice lies over it', () => {
    const h = skin(new Harness({ db: lake(), tile: [9, 10], facing: 'e' }));
    const g = h.sim.screen.collision;
    for (let x = 10; x < 14; x++) g.flags[10 * g.cols + x] = (g.flags[10 * g.cols + x] ?? 0) & ~(LOW | 1);
    h.hold(['right'], 30);
    expect(heroTile(h.sim)[0]).toBeGreaterThanOrEqual(11);
    expect(h.sim.hero.fsm.s).toBe('move');
  });
});

describe('diving', () => {
  it('goes under for two seconds on the roll button, then surfaces', () => {
    const h = skin(new Harness({ db: lake(), tile: [9, 10], facing: 'e' }));
    h.until((s) => s.hero.fsm.s === 'swim', 40, frameOf(['right']));
    h.hold(['right'], 20);
    h.step(frameOf([], ['roll']));
    expect(h.sim.hero.fsm.s).toBe('dive');
    expect(h.events.some((e) => e.t === 'sfx' && e.id === 'sfx_dive')).toBe(true);
    h.idle(DB.tuning.hero.diveTicks - 2);
    expect(h.sim.hero.fsm.s).toBe('dive');
    h.idle(4);
    expect(h.sim.hero.fsm.s).toBe('swim');
  });

  it('passes under every blow', () => {
    const h = skin(new Harness({ db: lake(), tile: [9, 10], facing: 'e' }));
    h.until((s) => s.hero.fsm.s === 'swim', 40, frameOf(['right']));
    h.hold(['right'], 20);
    h.step(frameOf([], ['roll']));
    const hp = h.sim.hero.hp;
    const hit = hurtHero(h.sim, { pos: h.sim.hero.pos, faction: 'enemy' }, 4, 2, 0);
    expect(hit).toBe(false);
    expect(h.sim.hero.hp).toBe(hp);
  });

  it('takes a sunk chest off the bottom, which swimming over leaves alone', () => {
    const chest: Thing = {
      k: 'chest',
      id: 'test_sunk',
      at: { x: 14, y: 10 },
      gives: { silver: 20, text: { en: 'Silver.', sv: 'Silver.' } },
      sunk: true,
    };
    const h = skin(new Harness({ db: lake([chest]), tile: [9, 10], facing: 'e' }));
    const silver = h.sim.state.hero.silver;
    h.until((s) => heroTile(s)[0] === 15, 300, frameOf(['right']));
    expect(h.sim.state.world.opened).not.toContain('test_sunk');
    h.until((s) => heroTile(s)[0] === 14, 300, frameOf(['left']));
    h.step(frameOf([], ['roll']));
    h.until((s) => s.mode === 'story', 30);
    expect(h.sim.state.world.opened).toContain('test_sunk');
    expect(h.sim.state.hero.silver).toBe(silver + 20);
  });

  it('brings up a sunk piece of heart', () => {
    const piece: Thing = { k: 'piece', id: 'test_sunk_piece', at: { x: 14, y: 10 }, sunk: true };
    const h = skin(new Harness({ db: lake([piece]), tile: [9, 10], facing: 'e' }));
    h.until((s) => heroTile(s)[0] === 14, 300, frameOf(['right']));
    expect(h.sim.state.world.pieces).not.toContain('test_sunk_piece');
    h.step(frameOf([], ['roll']));
    h.idle(4);
    expect(h.sim.state.world.pieces).toContain('test_sunk_piece');
  });
});

describe('currents', () => {
  it('carry a swimmer along their way', () => {
    const h = skin(new Harness({ db: lake(), tile: [9, 15], facing: 'e' }));
    h.until((s) => s.hero.fsm.s === 'swim', 40, frameOf(['right']));
    h.hold(['right'], 12);
    const x = h.sim.hero.pos.x;
    h.idle(20);
    expect(h.sim.hero.pos.x - x).toBeCloseTo(DB.tuning.hero.current * 20, 0);
  });

  it('are too strong to swim against when they surge, but a diver passes under', () => {
    const h = skin(new Harness({ db: lake(), tile: [12, 18], facing: 'n' }));
    h.sim.hero.pos = { x: 12 * 16 + 8, y: 18 * 16 + 14 };
    const g = h.sim.screen.collision;
    expect((g.flags[18 * g.cols + 12] ?? 0) & 64).toBe(64);
    // Swimming up into the surge only gets Ask pushed back out of it.
    h.hold(['up'], 60);
    expect(heroTile(h.sim)[1]).toBeGreaterThanOrEqual(17);
    expect(heroTile(h.sim)[1]).not.toBe(16);
    // Diving, Ask crosses it.
    h.step(frameOf(['up'], ['roll']));
    h.until((s) => heroTile(s)[1] <= 16, 60, frameOf(['up']));
    expect(heroTile(h.sim)[1]).toBe(16);
  });
});
