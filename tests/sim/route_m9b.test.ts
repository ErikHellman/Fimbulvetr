import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCREEN_IDS } from '@content/world/screens';
import type { GameState } from '@core/state/gameState';
import { loadSave } from '@core/state/save';
import { playM9b } from './routes/m9b';

/** The M9a save: Ask by the beacon's stone on Hrímfjöll. */
function m9a(): GameState {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m9a.json', import.meta.url), 'utf8'),
  );
  const loaded = loadSave(raw, new Set<string>(SCREEN_IDS));
  if (!loaded.ok) throw new Error(loaded.error.detail);
  return loaded.state;
}

describe('M9b route', () => {
  it('plays from the M9a save through Hrímturn: the mirror, Svellr, Hrímgerðr and the last captives', () => {
    const h = playM9b(m9a());
    expect(h.sim.state.flags.st_thane_hrimgerdr).toBe(true);
    expect(h.sim.state.flags.q_thanes).toBe(4);
    expect(h.sim.state.flags.q_captives).toBe(8);
    expect(h.sim.state.inv.items.mirror).toBe(1);
    expect(h.sim.state.world.pieces).toContain('hp_d7_beam');
    const c = h.sim.state.clock;
    console.log(
      `M9b route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play), day ${String(c.day)}, ${c.season}, hp ${String(h.sim.hero.hp)}/${String(h.sim.hero.maxHp)}`,
    );
  }, 600_000);

  it('replays identically', () => {
    expect(playM9b(m9a()).sim.hash()).toBe(playM9b(m9a()).sim.hash());
  }, 900_000);
});
