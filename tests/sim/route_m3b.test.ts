import { describe, expect, it } from 'vitest';
import { playM3b } from './routes/m3b';

describe('M3b route', () => {
  it('goes down into Sökkva Kvern and lights the second runestone', () => {
    const h = playM3b(5);
    const c = h.sim.state.clock;
    console.log(
      `M3b route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play), day ${String(c.day)}, hp ${String(h.sim.hero.hp)}/${String(h.sim.hero.maxHp)}, bombs ${String(h.sim.state.inv.items.bombs ?? 0)}`,
    );
  }, 240_000);

  it('replays identically', () => {
    expect(playM3b(9).sim.hash()).toBe(playM3b(9).sim.hash());
  }, 480_000);
});
