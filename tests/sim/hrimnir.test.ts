import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { HRIMNIR } from '@core/actors/enemies/hrimnir';
import type { Entity } from '@core/actors/entity';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness, frameOf } from './harness';

function hall(): ContentDb {
  const map = Array.from({ length: 22 }, (_, y) =>
    y === 0 || y === 21 ? '▣'.repeat(40) : '▣' + '□'.repeat(38) + '▣',
  );
  const things: Thing[] = [{ k: 'enemy', id: 'hrimnir', at: { x: 20, y: 4 } }];
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map, things } } };
}

function fight(god = true): { h: Harness; k: Entity } {
  const h = new Harness({ db: hall(), tile: [20, 12], facing: 'n' });
  h.sim.god = god;
  h.sim.state.inv.items.mirror = 1;
  h.sim.command({ t: 'equip', slot: 0, item: 'mirror' });
  h.idle(2);
  const k = h.sim.enemies.find((e) => e.def === 'hrimnir');
  if (k === undefined) throw new Error('no Hrímnir');
  h.until(() => h.sim.ring() !== null, 400);
  return { h, k };
}

describe('Hrímnir, the Rime King', () => {
  it('wakes inside a ring of binding that shrinks; outside it the frost bites', () => {
    const { h } = fight(false);
    const r0 = h.sim.ring()?.r ?? 0;
    expect(r0).toBeGreaterThan(HRIMNIR.ring.rMin);
    h.idle(60);
    expect(h.sim.ring()?.r ?? 0).toBeLessThan(r0);
    const hp = h.sim.hero.hp;
    h.sim.hero.pos = { x: 3 * 16 + 8, y: 19 * 16 + 14 };
    h.idle(240);
    expect(h.sim.hero.hp).toBeLessThan(hp);
  });

  it('breathes when the ring closes: a heavy blow, and the ring opens wide again', () => {
    const { h, k } = fight(false);
    const hp = h.sim.hero.hp;
    k.mem['ringR'] = HRIMNIR.ring.rMin + 0.05;
    h.idle(3);
    expect(h.sim.hero.hp).toBeLessThan(hp);
    expect(h.sim.ring()?.r).toBeGreaterThan(HRIMNIR.ring.rMax - 2);
  });

  it('turns every blow, but a struck hand stuns him with his heart-rune bared', () => {
    const { h, k } = fight();
    const hp = k.hp;
    h.sim.hero.pos = { x: k.pos.x, y: k.pos.y + 26 };
    h.press(['sword']).idle(14);
    expect(k.hp).toBe(hp);
    h.until(() => h.sim.enemies.some((e) => e.def === 'hrimnir_hand' && e.fsm.s === 'sweep'), 800);
    const hand = h.sim.enemies.find((e) => e.def === 'hrimnir_hand');
    if (hand === undefined) throw new Error('no hand');
    h.sim.hero.pos = { x: hand.pos.x + 18, y: hand.pos.y };
    h.sim.hero.facing = 'w';
    h.press(['sword']).idle(4);
    h.until(() => k.fsm.s === 'open', 60);
    expect(k.fsm.s).toBe('open');
    h.sim.hero.pos = { x: k.pos.x, y: k.pos.y + 26 };
    h.sim.hero.facing = 'n';
    h.press(['sword']).idle(14);
    expect(k.hp).toBeLessThan(hp);
  });

  it('from two thirds breathes rime, and the mirror sends it back into his heart', () => {
    const { h, k } = fight();
    k.hp = HRIMNIR.phaseAt[0];
    h.sim.hero.pos = { x: k.pos.x, y: 11 * 16 + 14 };
    for (let i = 0; i < 2000 && k.fsm.s !== 'open'; i++) {
      // Keep out of the hand's row, and hold the mirror up whenever he draws breath.
      const hand = h.sim.enemies.find((e) => e.def === 'hrimnir_hand');
      if (hand !== undefined && h.sim.hero.fsm.s === 'move')
        h.sim.hero.pos = { x: k.pos.x, y: hand.pos.y > 150 ? 120 : 200 };
      h.step(frameOf(['item1', 'up'], i === 0 ? ['item1'] : []));
    }
    expect(k.fsm.s).toBe('open');
  });

  it('from one third pulls pillars down, and their wreck is glaze', () => {
    const { h, k } = fight();
    k.hp = HRIMNIR.phaseAt[1];
    h.until(() => h.sim.enemies.some((e) => e.def === 'rime_pillar' && e.fsm.s === 'fallen'), 2400);
    const p = h.sim.enemies.find((e) => e.def === 'rime_pillar' && e.fsm.s === 'fallen');
    if (p === undefined) throw new Error('no fallen pillar');
    h.sim.hero.pos = { x: p.pos.x + 24, y: p.pos.y };
    h.step(frameOf(['left']))
      .step(frameOf(['left']))
      .step(frameOf(['left']))
      .idle(1);
    expect(h.sim.hero.mem['slide'] ?? 0).not.toBe(0);
  });
});
