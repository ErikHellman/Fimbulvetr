import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCREEN_IDS } from '@content/world/screens';
import type { GameState } from '@core/state/gameState';
import { loadSave } from '@core/state/save';
import { playM8b } from './routes/m8b';

/** The M8a save: Ask by Dvergagröf's stone at the chasm on a spring morning. */
function m8a(): GameState {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m8a.json', import.meta.url), 'utf8'),
  );
  const loaded = loadSave(raw, new Set<string>(SCREEN_IDS));
  if (!loaded.ok) throw new Error(loaded.error.detail);
  return loaded.state;
}

describe('M8b route', () => {
  it('plays from the M8a save through Ívaldi’s Forge to the thane’s fall, and home to the goat-house', () => {
    const h = playM8b(m8a());
    expect(h.sim.state.flags.st_thane_ivaldi).toBe(true);
    expect(h.sim.state.flags.q_thanes).toBeGreaterThanOrEqual(3);
    expect(h.sim.state.flags.q_captives).toBeGreaterThanOrEqual(6);
    expect(h.sim.state.inv.galdr).toContain('skjalfti');
    const c = h.sim.state.clock;
    console.log(
      `M8b route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play), day ${String(c.day)}, ${c.season}, hp ${String(h.sim.hero.hp)}/${String(h.sim.hero.maxHp)}`,
    );
  }, 600_000);

  it('replays identically', () => {
    expect(playM8b(m8a()).sim.hash()).toBe(playM8b(m8a()).sim.hash());
  }, 900_000);
});
