import { describe, expect, it } from 'vitest';
import { playM5a } from './routes/m5a';

describe('M5a route', () => {
  it('wins Styrr’s last duel, learns Bragð, and opens the pass into the Fimbulvetr', () => {
    const h = playM5a(5);
    const c = h.sim.state.clock;
    console.log(
      `M5a route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play), day ${String(c.day)} ${String(Math.floor(c.minute / 60))}:${String(c.minute % 60).padStart(2, '0')}, hp ${String(h.sim.hero.hp)}/${String(h.sim.hero.maxHp)}`,
    );
  }, 120_000);

  it('replays identically', () => {
    expect(playM5a(9).sim.hash()).toBe(playM5a(9).sim.hash());
  }, 240_000);
});
