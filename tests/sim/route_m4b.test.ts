import { describe, expect, it } from 'vitest';
import { playM4b } from './routes/m4b';

describe('M4b route', () => {
  it('walks Konungshaugr from the door to the third runestone, and home by Farvegr', () => {
    const h = playM4b(5);
    const c = h.sim.state.clock;
    console.log(
      `M4b route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play), day ${String(c.day)} ${String(Math.floor(c.minute / 60))}:${String(c.minute % 60).padStart(2, '0')}, hp ${String(h.sim.hero.hp)}/${String(h.sim.hero.maxHp)}, arrows ${String(h.sim.state.inv.items.arrows ?? 0)}`,
    );
  }, 180_000);

  it('replays identically', () => {
    expect(playM4b(9).sim.hash()).toBe(playM4b(9).sim.hash());
  }, 360_000);
});
