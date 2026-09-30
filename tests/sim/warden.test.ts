import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness } from './harness';

/** A walled crypt room on test_a, part of d3, with the warden at (20, 10) and the bow's chest on `clear`. */
function hall(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '8'.repeat(40) : '8' + '7'.repeat(38) + '8',
  );
  const things: Thing[] = [
    {
      k: 'enemy',
      id: 'haugvordr',
      at: { x: 20, y: 10 },
      onDeath: [{ k: 'set', flag: 'st_d3_warden', value: true }],
      when: { k: 'not', c: { k: 'flag', id: 'st_d3_warden' } },
    },
    { k: 'chest', id: 'c_bow', at: { x: 20, y: 4 }, gives: { item: 'bow' }, appear: 'clear' },
  ];
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things, dungeon: 'd3' } } };
}

const warden = (h: Harness) => h.sim.enemies.find((e) => e.def === 'haugvordr');

describe('Haugvörðr, the barrow-warden', () => {
  it('shows on the boss bar, and turns blows from the front', () => {
    const h = new Harness({ db: hall(), tile: [20, 13], facing: 'n' });
    h.sim.hero.hp = 999;
    h.sim.hero.maxHp = 999;
    h.idle(2);
    expect(h.sim.boss()?.name.en).toMatch(/barrow-warden/);
    const w = warden(h);
    if (w === undefined) throw new Error('no warden');
    w.facing = 's';
    w.mem['stun'] = 100;
    h.sim.hero.pos = { x: w.pos.x, y: w.pos.y + 18 };
    h.press(['sword']).idle(20);
    expect(w.hp).toBe(w.maxHp);
  });

  it('braces 500 ms before its bash, and a wall leaves it dazed and open', () => {
    const h = new Harness({ db: hall(), tile: [20, 16], facing: 'n' });
    h.sim.hero.hp = 999;
    h.sim.hero.maxHp = 999;
    h.until(() => warden(h)?.fsm.s === 'brace', 300);
    const braced = h.sim.tick;
    // Step out of its line.
    h.sim.hero.pos = { x: 8 * 16 + 8, y: h.sim.hero.pos.y };
    h.until(() => warden(h)?.fsm.s === 'bash', 60);
    expect(h.sim.tick - braced).toBe(30);
    h.until(() => warden(h)?.fsm.s === 'dazed', 200);
    const w = warden(h);
    if (w === undefined) throw new Error('no warden');
    expect(w.mem['open']).toBe(1);
    const hp = w.hp;
    h.sim.hero.pos = { x: w.pos.x, y: w.pos.y - 18 };
    h.sim.hero.facing = 's';
    h.press(['sword']).idle(16);
    expect(w.hp).toBeLessThan(hp);
    h.expectAnims();
  });

  it('dies for good, gives up the bow’s chest, and leaves the dungeon’s boss alive', () => {
    const h = new Harness({ db: hall(), tile: [20, 16], facing: 'n' });
    h.idle(2);
    h.sim.command({ t: 'killAll' });
    h.idle(4);
    expect(h.sim.state.flags.st_d3_warden).toBe(true);
    expect(h.sim.state.dungeons.d3.bossDead).toBe(false);
    expect(h.events.some((e) => e.t === 'bossDead')).toBe(false);
    expect(h.sim.actors.find((a) => a.def === 'chest')?.mem['wait']).toBe(0);
    h.sim.command({ t: 'warp', screen: 'test_a', x: 20 * 16 + 8, y: 16 * 16 + 14 });
    h.idle(2);
    expect(warden(h)).toBeUndefined();
  });
});
