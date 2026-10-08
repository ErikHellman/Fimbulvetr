import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCREEN_IDS } from '@content/world/screens';
import type { GameState } from '@core/state/gameState';
import { loadSave } from '@core/state/save';
import { playM7b } from './routes/m7b';

/** The M7a save: Ask in the Refuge's hall on a winter night. */
function m7a(): GameState {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m7a.json', import.meta.url), 'utf8'),
  );
  const loaded = loadSave(raw, new Set<string>(SCREEN_IDS));
  if (!loaded.ok) throw new Error(loaded.error.detail);
  return loaded.state;
}

describe('M7b route', () => {
  it('plays from the M7a save through Sökkva Hof, Hrönn and Nykr, to the Norns’ loom and a turned year', () => {
    const h = playM7b(m7a());
    expect(h.sim.state.flags.st_loom_woven).toBe(true);
    const c = h.sim.state.clock;
    console.log(
      `M7b route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play), day ${String(c.day)}, ${c.season}, hp ${String(h.sim.hero.hp)}/${String(h.sim.hero.maxHp)}`,
    );
  }, 600_000);

  it('replays identically', () => {
    expect(playM7b(m7a()).sim.hash()).toBe(playM7b(m7a()).sim.hash());
  }, 600_000);
});
