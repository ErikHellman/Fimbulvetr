import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCREEN_IDS } from '@content/world/screens';
import type { GameState } from '@core/state/gameState';
import { loadSave } from '@core/state/save';
import { playM8a } from './routes/m8a';

/** The M7b save: Ask in the Refuge's hall on a spring night. */
function m7b(): GameState {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m7b.json', import.meta.url), 'utf8'),
  );
  const loaded = loadSave(raw, new Set<string>(SCREEN_IDS));
  if (!loaded.ok) throw new Error(loaded.error.detail);
  return loaded.state;
}

describe('M8a route', () => {
  it('plays from the M7b save over the chasm, through the escort and the cart road, to Embla’s second letter', () => {
    const h = playM8a(m7b());
    expect(h.sim.state.flags.q_foreman).toBe(5);
    const c = h.sim.state.clock;
    console.log(
      `M8a route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play), day ${String(c.day)}, ${c.season}, hp ${String(h.sim.hero.hp)}/${String(h.sim.hero.maxHp)}`,
    );
  }, 600_000);

  it('replays identically', () => {
    expect(playM8a(m7b()).sim.hash()).toBe(playM8a(m7b()).sim.hash());
  }, 600_000);
});
