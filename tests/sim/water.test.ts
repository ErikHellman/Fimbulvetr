import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import { blast } from '@core/sim/systems/bombs';
import { equip } from '@core/sim/systems/items';
import { giveItem } from '@core/story/effects';
import { LOW, SOLID } from '@core/world/collision';
import { tileFeet, type Thing } from '@core/world/screen';
import { Harness } from './harness';

/**
 * test_a with Sökkva Kvern's water: a sluice floor (floods at 1) on row 10, cols 10–13, and race planks
 * (float at 1) on row 10, cols 20–23; wheels for level 1 at (6, 5) and level 0 at (8, 5).
 */
function mill(things: Thing[] = []): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) => {
    if (y === 0 || y === 21) return '#'.repeat(40);
    if (y === 10) return '#' + '.'.repeat(9) + '1111' + '.'.repeat(6) + '3333' + '.'.repeat(15) + '#';
    return '#' + '.'.repeat(38) + '#';
  });
  const wheels: Thing[] = [
    { k: 'wheel', at: { x: 6, y: 5 }, level: 1 },
    { k: 'wheel', at: { x: 8, y: 5 }, level: 0 },
  ];
  const screen = { ...DB.screens.test_a, map, water: 'w_d2_level' as const, things: [...wheels, ...things] };
  return { ...DB, screens: { ...DB.screens, test_a: screen } };
}

const flagsAt = (h: Harness, x: number, y: number): number => h.sim.screen.collision.flags[y * 40 + x] ?? 0;
const wet = (h: Harness, x: number, y: number): boolean =>
  (flagsAt(h, x, y) & (SOLID | LOW)) === (SOLID | LOW);
const level = (h: Harness) => h.sim.state.flags.w_d2_level ?? 0;
const wheels = (h: Harness) => h.sim.actors.filter((a) => a.def === 'wheel').map((a) => a.anim);

describe('water levels', () => {
  it('leave the sluice dry and the race planks at the bottom at level 0', () => {
    const h = new Harness({ db: mill(), tile: [6, 6] });
    h.idle(1);
    expect(wet(h, 11, 10)).toBe(false);
    expect(wet(h, 21, 10)).toBe(true);
    expect(wheels(h)).toEqual(['off', 'on']);
    h.expectAnims();
  });

  it('rise when a wheel is struck: the sluice floods and the planks float', () => {
    const h = new Harness({ db: mill(), tile: [6, 6], facing: 'n' });
    h.idle(1).press(['sword']).idle(10);
    expect(level(h)).toBe(1);
    expect(wet(h, 11, 10)).toBe(true);
    expect(wet(h, 21, 10)).toBe(false);
    expect(wheels(h)).toEqual(['on', 'off']);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_wheel' });
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_water' });
    expect(h.events).toContainEqual({ t: 'coverChanged', screen: 'test_a' });
    h.expectAnims();
  });

  it('turn under the boomerang from afar, and in a blast', () => {
    const h = new Harness({ db: mill(), tile: [6, 12], facing: 'n' });
    giveItem(h.sim, 'boomerang', 1);
    equip(h.sim, 0, 'boomerang');
    h.idle(1).press(['item1']).idle(60);
    expect(level(h)).toBe(1);
    blast(h.sim, tileFeet({ x: 8, y: 6 }));
    h.idle(2);
    expect(level(h)).toBe(0);
    expect(wet(h, 11, 10)).toBe(false);
  });

  it('will not change the water under Ask', () => {
    const h = new Harness({
      db: mill([{ k: 'wheel', at: { x: 11, y: 9 }, level: 1 }]),
      tile: [11, 10],
      facing: 'n',
    });
    h.idle(1).press(['sword']).idle(10);
    expect(level(h)).toBe(0);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_block' });
    expect(wet(h, 11, 10)).toBe(false);
  });

  it('drowns what walks in the flood and sinks what lies there, but not what flies', () => {
    const things: Thing[] = [
      { k: 'enemy', id: 'vargr', at: { x: 12, y: 10 } },
      { k: 'enemy', id: 'rime_raven', at: { x: 11, y: 10 } },
      { k: 'prop', id: 'pot', at: { x: 13, y: 10 } },
    ];
    const h = new Harness({ db: mill(things), tile: [30, 16] });
    h.idle(1);
    h.sim.command({ t: 'setFlag', flag: 'w_d2_level', value: 1 });
    h.idle(1);
    expect(h.events).toContainEqual(expect.objectContaining({ t: 'killed', def: 'vargr' }));
    expect(h.sim.enemies.some((e) => e.def === 'rime_raven')).toBe(true);
    expect(h.sim.actors.some((a) => a.def === 'pot')).toBe(false);
  });

  it('stays where it was set when Ask comes back', () => {
    const h = new Harness({ db: mill(), tile: [6, 6], facing: 'n' });
    h.idle(1).press(['sword']).idle(10);
    h.sim.command({ t: 'warp', screen: 'test_a', x: 6, y: 12 });
    h.idle(40);
    expect(wet(h, 11, 10)).toBe(true);
    expect(wet(h, 21, 10)).toBe(false);
    expect(wheels(h)).toEqual(['on', 'off']);
  });
});
