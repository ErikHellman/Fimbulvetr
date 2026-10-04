import { describe, expect, it } from 'vitest';
import { playPrologue } from './routes/m1a';

describe('M1a route', () => {
  it('plays the prologue from New Game to the raid with real inputs', () => {
    const h = playPrologue(7);
    expect(h.sim.state.flags.st_raid_begun).toBe(true);
    expect(h.sim.state.clock.season).toBe('autumn');
    expect(h.sim.state.inv.weapon).toBe('pitchfork');
    expect(h.sim.screen.id).toBe('ask_int_longhouse');
    expect(h.sim.enemies.map((e) => e.def)).toEqual(['draugr']);
    expect(h.sim.state.hero.silver).toBe(5);
    expect(h.sim.state.inv.slots).toContain('lantern');
    console.log(
      `M1a route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play)`,
    );
  }, 60_000);

  it('replays identically', () => {
    expect(playPrologue(11).sim.hash()).toBe(playPrologue(11).sim.hash());
  }, 120_000);
});
