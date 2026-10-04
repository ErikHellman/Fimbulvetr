import { describe, expect, it } from 'vitest';
import { dungeonOf } from '@core/state/dungeons';
import { playD1 } from './routes/m1c';

describe('M1c route', () => {
  it('walks Rótarhellir from its mouth, beats Rótvættr and lights the first stone', () => {
    const h = playD1(5);
    expect(h.sim.state.world.opened).toEqual(
      expect.arrayContaining(['d1_c_key1', 'd1_c_key2', 'd1_c_boomerang', 'd1_hc']),
    );
    expect(dungeonOf(h.sim.state, 'd1')).toMatchObject({ bossDead: true, keys: 1 });
    console.log(
      `M1c route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play), hp ${String(h.sim.hero.hp)}/${String(h.sim.hero.maxHp)}`,
    );
  }, 120_000);

  it('replays identically', () => {
    expect(playD1(9).sim.hash()).toBe(playD1(9).sim.hash());
  }, 240_000);
});
