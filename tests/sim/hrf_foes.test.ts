import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { EnemyId } from '@content/ids';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { SHOTS } from '@core/sim/systems/projectiles';
import { Harness } from './harness';

/** Opens test_a and puts `id` at (x, y). */
function arena(id: EnemyId, x: number, y: number): ContentDb {
  const open = Array.from({ length: 22 }, (_, r) =>
    r === 0 || r === 21 ? '#'.repeat(40) : '#' + '.'.repeat(38) + '#',
  );
  const things: Thing[] = [{ k: 'enemy', id, at: { x, y } }];
  return { ...DB, screens: { ...DB.screens, test_a: { ...DB.screens.test_a, map: open, things } } };
}

describe('the frost wisp', () => {
  it('lines up with Ask, glows, and looses a rime bolt that strikes', () => {
    const h = new Harness({ db: arena('frostvaettr', 24, 6), tile: [12, 10] });
    const hp = h.sim.hero.hp;
    h.until((s) => s.enemies[0]?.fsm.s === 'glow', 400);
    const wisp = h.sim.enemies[0];
    expect(wisp).toBeDefined();
    // Lined up on Ask's row, facing Ask.
    expect(Math.abs((wisp?.pos.y ?? 0) - h.sim.hero.pos.y)).toBeLessThanOrEqual(10);
    expect(wisp?.facing).toBe('w');
    h.until((s) => s.hero.hp < hp, 200);
    expect(h.sim.hero.hp).toBe(hp - SHOTS.bolt.amount);
  });

  it('is stopped by the shield from the front', () => {
    const h = new Harness({ db: arena('frostvaettr', 24, 10), tile: [12, 10], facing: 'e' });
    const hp = h.sim.hero.hp;
    h.hold(['shield'], 300);
    expect(h.sim.hero.hp).toBe(hp);
    expect(h.count('hit')).toBeGreaterThan(0);
  });

  it('goes out at one touch of fire', () => {
    expect(DB.enemies.frostvaettr.weak).toContain('fire');
    expect(DB.enemies.isvargr.weak).toContain('fire');
  });
});
