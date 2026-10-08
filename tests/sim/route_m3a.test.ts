import { describe, expect, it } from 'vitest';
import { playM3a } from './routes/m3a';

describe('M3a route', () => {
  it('crosses the weir, hears of the drowned mill and lands a fish at Kári’s jetty', () => {
    const h = playM3a(5);
    const c = h.sim.state.clock;
    console.log(
      `M3a route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play), day ${String(c.day)} ${String(Math.floor(c.minute / 60))}:${String(c.minute % 60).padStart(2, '0')}, hp ${String(h.sim.hero.hp)}/${String(h.sim.hero.maxHp)}, silver ${String(h.sim.state.hero.silver)}`,
    );
  }, 120_000);

  it('replays identically', () => {
    expect(playM3a(9).sim.hash()).toBe(playM3a(9).sim.hash());
  }, 240_000);
});
