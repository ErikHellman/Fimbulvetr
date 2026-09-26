import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { TUNING } from '@content/tuning';
import { PIERCE_SHIELD } from '@core/combat/hit';
import type { ContentDb } from '@core/sim/db';
import { Harness } from './harness';

/** The training dummy, made to bite on contact. */
function biting(tags = 0): ContentDb {
  return {
    ...DB,
    enemies: { ...DB.enemies, dummy: { ...DB.enemies.dummy, touch: { amount: 2, knock: 3, tags } } },
  };
}

describe('hurt path', () => {
  it('hurts the hero on contact, then grants i-frames', () => {
    const h = new Harness({ db: biting(), tile: [21, 9], facing: 'e' });
    const hp = h.sim.hero.hp;
    h.until((s) => s.hero.fsm.s === 'hurt', 120, h.frame(['right']));
    expect(h.sim.hero.hp).toBe(hp - 2);
    expect(h.sim.hero.iframes).toBeGreaterThan(TUNING.hero.hurtIframes - 3);
    expect(h.count('hit')).toBe(1);
    h.hold(['right'], 30);
    expect(h.sim.hero.hp).toBe(hp - 2);
  });

  it('is blocked by a raised shield facing the enemy', () => {
    const h = new Harness({ db: biting(), tile: [21, 9], facing: 'e' });
    const hp = h.sim.hero.hp;
    h.hold(['shield', 'right'], 90);
    expect(h.sim.hero.hp).toBe(hp);
    expect(h.events.some((e) => e.t === 'hit' && e.blocked)).toBe(true);
  });

  it('goes through the shield when the hit pierces', () => {
    const h = new Harness({ db: biting(PIERCE_SHIELD), tile: [21, 9], facing: 'e' });
    const hp = h.sim.hero.hp;
    h.hold(['shield', 'right'], 90);
    expect(h.sim.hero.hp).toBe(hp - 2);
  });
});
