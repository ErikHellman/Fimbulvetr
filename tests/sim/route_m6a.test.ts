import { describe, expect, it } from 'vitest';
import { playM6a } from './routes/m6a';

describe('M6a route', () => {
  it('melts the rime, hears the twist at the drained camp, and trades Hrafn the hook', () => {
    const h = playM6a(5);
    const c = h.sim.state.clock;
    console.log(
      `M6a route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play), day ${String(c.day)} ${String(Math.floor(c.minute / 60))}:${String(c.minute % 60).padStart(2, '0')}, hp ${String(h.sim.hero.hp)}/${String(h.sim.hero.maxHp)}`,
    );
  }, 120_000);

  it('replays identically', () => {
    expect(playM6a(9).sim.hash()).toBe(playM6a(9).sim.hash());
  }, 240_000);
});
