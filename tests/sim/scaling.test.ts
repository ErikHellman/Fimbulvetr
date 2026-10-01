import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { EnemyId } from '@content/ids';
import type { ContentDb } from '@core/sim/db';
import type { Thing } from '@core/world/screen';
import { Harness, frameOf } from './harness';

/** test_a (Askdalr, a lowland) with one `id` at (16, 10). */
function field(id: EnemyId, screen: 'test_a' | 'd1_r01' = 'test_a'): ContentDb {
  const things: Thing[] = [{ k: 'enemy', id, at: { x: 16, y: 10 } }];
  return { ...DB, screens: { ...DB.screens, [screen]: { ...DB.screens[screen], things } } };
}

function withStones(n: number, db: ContentDb, screen: 'test_a' | 'd1_r01' = 'test_a'): Harness {
  const h = new Harness({ db, screen, tile: [16, 14] });
  const flags = DB.tuning.stones.flags;
  for (let i = 0; i < n; i++) {
    const f = flags[i];
    if (f !== undefined) h.sim.state.flags[f] = true;
  }
  // Re-enter so the things spawn under the lit stones.
  h.sim.command({ t: 'warp', screen, x: 16 * 16 + 8, y: 14 * 16 + 14 });
  h.idle(1);
  return h;
}

describe('runestone scaling', () => {
  it('leaves lowland foes alone before the second stone', () => {
    for (const n of [0, 1]) {
      const h = withStones(n, field('draugr'));
      expect(h.sim.enemies[0]?.maxHp).toBe(DB.enemies.draugr.hp);
      expect(h.sim.enemies[0]?.mem['tier']).toBeUndefined();
    }
  });

  it('gives them half again their health at two stones, double and a harder blow at three', () => {
    const two = withStones(2, field('draugr'));
    expect(two.sim.enemies[0]?.maxHp).toBe(12);
    expect(two.sim.enemies[0]?.hp).toBe(12);
    const three = withStones(3, field('draugr'));
    expect(three.sim.enemies[0]?.maxHp).toBe(16);
    // The draugr's blow is 4 quarter hearts; at three stones it lands 5 on an unarmoured Ask.
    const hp = three.sim.hero.hp;
    three.sim.hero.pos = { x: 16 * 16 + 8, y: 11 * 16 + 14 };
    three.sim.hero.facing = 'n';
    // The shield turns its touch; the heavy blow staggers through.
    three.until((s) => s.hero.hp < hp, 300, frameOf(['shield']));
    expect(hp - three.sim.hero.hp).toBe(5);
  });

  it('never touches dungeon rooms, bosses or the immortal', () => {
    const d = withStones(3, field('draugr', 'd1_r01'), 'd1_r01');
    expect(d.sim.enemies[0]?.maxHp).toBe(DB.enemies.draugr.hp);
    const dummy = withStones(3, field('dummy'));
    expect(dummy.sim.enemies[0]?.maxHp).toBe(DB.enemies.dummy.hp);
  });
});
