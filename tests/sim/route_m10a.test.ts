import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCREEN_IDS } from '@content/world/screens';
import type { GameState } from '@core/state/gameState';
import { loadSave } from '@core/state/save';
import { playM10a } from './routes/m10a';

/** The M9b save: Ask back by the beacon's stone. */
function m9b(): GameState {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m9b.json', import.meta.url), 'utf8'),
  );
  const loaded = loadSave(raw, new Set<string>(SCREEN_IDS));
  if (!loaded.ok) throw new Error(loaded.error.detail);
  return loaded.state;
}

describe('M10a route', () => {
  it('plays from the M9b save through Útgarðr: Halvar’s words, three seals, Jötunvörðr and Kolbeinn', () => {
    const h = playM10a(m9b());
    expect(h.sim.state.flags).toMatchObject({
      st_utgard_open: true,
      st_d8_seal_w: true,
      st_d8_seal_e: true,
      st_d8_seal_n: true,
      st_d8_warden: true,
      st_kolbeinn_beaten: true,
      st_kolbeinn_spared: true,
    });
    expect(h.sim.state.world.pieces).toContain('hp_d8_keep');
    expect(h.sim.screen.id).toBe('d8_r13');
    const c = h.sim.state.clock;
    console.log(
      `M10a route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play), day ${String(c.day)}, ${c.season}, hp ${String(h.sim.hero.hp)}/${String(h.sim.hero.maxHp)}`,
    );
  }, 600_000);

  it('replays identically', () => {
    expect(playM10a(m9b()).sim.hash()).toBe(playM10a(m9b()).sim.hash());
  }, 900_000);
});
