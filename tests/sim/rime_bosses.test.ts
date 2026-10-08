import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { HRIMGERDR } from '@core/actors/enemies/hrimgerdr';
import { SVELLR } from '@core/actors/enemies/svellr';
import type { Entity } from '@core/actors/entity';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness, frameOf } from './harness';

function hall(things: Thing[]): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '▪'.repeat(40) : '▪' + '▫'.repeat(38) + '▪',
  );
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

function boss(h: Harness, id: string): Entity {
  const e = h.sim.enemies.find((a) => a.def === id);
  if (e === undefined) throw new Error(`no ${id}`);
  return e;
}

function until(h: Harness, e: Entity, state: string, max = 1200): void {
  h.until(() => e.fsm.s === state, max);
}

describe('Svellr, the glacier construct', () => {
  it('scrapes, charges straight across the hall into the wall, and stands stunned and open', () => {
    const h = new Harness({ db: hall([{ k: 'enemy', id: 'svellr', at: { x: 20, y: 5 } }]), tile: [20, 15] });
    h.sim.god = true;
    const s = boss(h, 'svellr');
    until(h, s, 'scrape');
    expect(s.mem['guard']).toBe(1);
    expect(s.facing).toBe('s');
    until(h, s, 'charge');
    const y0 = s.pos.y;
    until(h, s, 'stunned', 200);
    expect(s.pos.y).toBeGreaterThan(y0 + 150);
    expect(s.mem['guard']).toBe(0);
    h.idle(SVELLR.stunTicks);
    expect(['scrape', 'turn', 'charge']).toContain(s.fsm.s);
  });

  it('turns the sword while it charges, and takes it while stunned', () => {
    const h = new Harness({ db: hall([{ k: 'enemy', id: 'svellr', at: { x: 20, y: 5 } }]), tile: [20, 15] });
    h.sim.god = true;
    const s = boss(h, 'svellr');
    until(h, s, 'stunned', 800);
    const hp = s.hp;
    h.sim.hero.pos = { x: s.pos.x, y: s.pos.y - 18 };
    h.sim.hero.facing = 's';
    h.press(['sword']).idle(20);
    expect(s.hp).toBeLessThan(hp);
  });
});

describe('Hrímgerðr, the Glass', () => {
  function fight(): { h: Harness; hg: Entity } {
    const h = new Harness({
      db: hall([{ k: 'enemy', id: 'hrimgerdr', at: { x: 20, y: 4 } }]),
      tile: [20, 14],
    });
    h.sim.god = true;
    h.sim.state.inv.items.mirror = 1;
    h.sim.command({ t: 'equip', slot: 0, item: 'mirror' });
    h.step(frameOf(['up'], ['up'])).idle(2);
    return { h, hg: boss(h, 'hrimgerdr') };
  }

  /** Holds the mirror up, facing north, until `done` or `max` ticks. */
  function mirror(h: Harness, done: () => boolean, max = 1200): void {
    for (let i = 0; i < max && !done(); i++) h.step(frameOf(['item1'], i === 0 ? ['item1'] : []));
  }

  it('turns every blow while she casts, and kneels open when her own bolt comes back', () => {
    const { h, hg } = fight();
    until(h, hg, 'cast');
    expect(hg.mem['guard']).toBe(1);
    mirror(h, () => hg.fsm.s === 'kneel');
    expect(hg.fsm.s).toBe('kneel');
    expect(hg.mem['guard']).toBe(0);
  });

  it('at two thirds glazes the floor below her, and at one third brings icicles down', () => {
    const { h, hg } = fight();
    hg.hp = HRIMGERDR.phaseAt[0];
    mirror(h, () => hg.fsm.s === 'kneel');
    h.idle(HRIMGERDR.kneelTicks + 4);
    h.until(() => hg.fsm.s === 'cast', 200);
    expect(h.sim.rimeFloor()).toBe(HRIMGERDR.rimeRow);
    hg.hp = HRIMGERDR.phaseAt[1];
    mirror(h, () => hg.fsm.s === 'kneel');
    h.idle(HRIMGERDR.kneelTicks + 4);
    h.until(() => h.sim.enemies.some((e) => e.def === 'icicle'), 600);
    expect(h.sim.enemies.some((e) => e.def === 'icicle')).toBe(true);
  });

  it('a glazed floor sets Ask sliding', () => {
    const { h, hg } = fight();
    hg.mem['rimeFloor'] = HRIMGERDR.rimeRow;
    h.step(frameOf(['left']))
      .step(frameOf(['left']))
      .idle(1);
    expect(h.sim.hero.mem['slide'] ?? 0).not.toBe(0);
  });
});
