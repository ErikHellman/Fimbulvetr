import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCREEN_IDS } from '@content/world/screens';
import type { GameState } from '@core/state/gameState';
import { loadSave } from '@core/state/save';
import { playM10b } from './routes/m10b';

/** The M10a save: Ask in Kolbeinn's hall, Kolbeinn spared, the binding hall west. */
function m10a(): GameState {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m10a.json', import.meta.url), 'utf8'),
  );
  const loaded = loadSave(raw, new Set<string>(SCREEN_IDS));
  if (!loaded.ok) throw new Error(loaded.error.detail);
  return loaded.state;
}

describe('M10b route', () => {
  it('plays from the M10a save through the binding hall: Hrímnir, the ending, and spring at the farm', () => {
    const h = playM10b(m10a());
    expect(h.sim.state.flags.st_hrimnir_dead).toBe(true);
    expect(h.sim.state.flags.st_end_stay).toBe(true);
    expect(h.sim.state.flags.st_game_done).toBe(true);
    expect(h.sim.screen.id).toBe('ask_farmyard');
    expect(h.sim.state.clock.season).toBe('spring');
    const c = h.sim.state.clock;
    console.log(
      `M10b route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play), day ${String(c.day)}, ${c.season}, hp ${String(h.sim.hero.hp)}/${String(h.sim.hero.maxHp)}`,
    );
  }, 600_000);

  it('replays identically', () => {
    expect(playM10b(m10a()).sim.hash()).toBe(playM10b(m10a()).sim.hash());
  }, 900_000);
});
