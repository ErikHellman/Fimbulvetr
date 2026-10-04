import { describe, expect, it } from 'vitest';
import { playM2b } from './routes/m2b';

describe('M2b route', () => {
  it('walks from Önundr to Uppvík, learns Eldr from Sölvi and burns the first leaves', () => {
    const h = playM2b(5);
    const c = h.sim.state.clock;
    console.log(
      `M2b route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play), day ${String(c.day)} ${String(Math.floor(c.minute / 60))}:${String(c.minute % 60).padStart(2, '0')}, hp ${String(h.sim.hero.hp)}/${String(h.sim.hero.maxHp)}, silver ${String(h.sim.state.hero.silver)}`,
    );
  }, 120_000);

  it('replays identically', () => {
    expect(playM2b(9).sim.hash()).toBe(playM2b(9).sim.hash());
  }, 240_000);
});
