import { describe, expect, it } from 'vitest';
import { playRaidToRoots } from './routes/m1b';

describe('M1b route', () => {
  it('escapes the raid, hears the legend and walks Myrkviðr to the root cave', () => {
    const h = playRaidToRoots(5);
    expect(h.sim.screen.id).toBe('myr_roots');
    expect(h.sim.state.clock.policy).toBe('cycling');
    expect(h.sim.state.world.visited).toEqual(
      expect.arrayContaining(['myr_road_s', 'myr_road', 'myr_pines', 'myr_roots']),
    );
    console.log(
      `M1b route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play)`,
    );
  }, 120_000);

  it('replays identically', () => {
    expect(playRaidToRoots(9).sim.hash()).toBe(playRaidToRoots(9).sim.hash());
  }, 240_000);
});
