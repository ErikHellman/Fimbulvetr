import { describe, expect, it } from 'vitest';
import { playM2c } from './routes/m2c';

describe('M2c route', () => {
  it('takes the hunt, kills the pack leader and collects the bounty', () => {
    const h = playM2c(5);
    const c = h.sim.state.clock;
    console.log(
      `M2c route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play), day ${String(c.day)} ${String(Math.floor(c.minute / 60))}:${String(c.minute % 60).padStart(2, '0')}, hp ${String(h.sim.hero.hp)}/${String(h.sim.hero.maxHp)}, silver ${String(h.sim.state.hero.silver)}`,
    );
  }, 120_000);

  it('replays identically', () => {
    expect(playM2c(9).sim.hash()).toBe(playM2c(9).sim.hash());
  }, 240_000);
});
