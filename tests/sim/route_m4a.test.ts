import { describe, expect, it } from 'vitest';
import { playM4a } from './routes/m4a';

describe('M4a route', () => {
  it('opens the rockfall, learns from Styrr and keeps the barrow-watch', () => {
    const h = playM4a(5);
    const c = h.sim.state.clock;
    console.log(
      `M4a route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play), day ${String(c.day)} ${String(Math.floor(c.minute / 60))}:${String(c.minute % 60).padStart(2, '0')}, hp ${String(h.sim.hero.hp)}/${String(h.sim.hero.maxHp)}, silver ${String(h.sim.state.hero.silver)}`,
    );
  }, 120_000);

  it('replays identically', () => {
    expect(playM4a(9).sim.hash()).toBe(playM4a(9).sim.hash());
  }, 240_000);
});
