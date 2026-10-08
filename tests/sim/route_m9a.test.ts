import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCREEN_IDS } from '@content/world/screens';
import type { GameState } from '@core/state/gameState';
import { loadSave } from '@core/state/save';
import { playM9a } from './routes/m9a';

/** The M8b save: Ask in Askdalr's village, by Þorkell's goat-house. */
function m8b(): GameState {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m8b.json', import.meta.url), 'utf8'),
  );
  const loaded = loadSave(raw, new Set<string>(SCREEN_IDS));
  if (!loaded.ok) throw new Error(loaded.error.detail);
  return loaded.state;
}

describe('M9a route', () => {
  it('plays from the M8b save over Hrímfjöll: the glacier, the beacon, the third letter and the cairn', () => {
    const h = playM9a(m8b());
    expect(h.sim.state.flags.st_hrf_reached).toBe(true);
    expect(h.sim.state.flags.st_beacon_lit).toBe(true);
    expect(h.sim.state.flags.st_letter3_found).toBe(true);
    expect(h.sim.state.world.warps).toContain('hrimfjoll');
    expect(h.sim.state.world.pieces).toContain('hp_hrf_glacier');
    const c = h.sim.state.clock;
    console.log(
      `M9a route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play), day ${String(c.day)}, ${c.season}, hp ${String(h.sim.hero.hp)}/${String(h.sim.hero.maxHp)}`,
    );
  }, 600_000);

  it('replays identically', () => {
    expect(playM9a(m8b()).sim.hash()).toBe(playM9a(m8b()).sim.hash());
  }, 900_000);
});
