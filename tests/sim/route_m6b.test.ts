import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCREEN_IDS } from '@content/world/screens';
import { loadSave } from '@core/state/save';
import { playM6b } from './routes/m6b';

describe('M6b route', () => {
  it('plays Helgrind from its gate to Náströnd’s fall', () => {
    const h = playM6b(5);
    const c = h.sim.state.clock;
    console.log(
      `M6b route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play), day ${String(c.day)} ${String(Math.floor(c.minute / 60))}:${String(c.minute % 60).padStart(2, '0')}, hp ${String(h.sim.hero.hp)}/${String(h.sim.hero.maxHp)}`,
    );
  }, 240_000);

  it('plays on from the M6a save, stood before the gate', () => {
    const raw: unknown = JSON.parse(
      readFileSync(new URL('../fixtures/saves/v1-m6a.json', import.meta.url), 'utf8'),
    );
    const loaded = loadSave(raw, new Set<string>(SCREEN_IDS));
    if (!loaded.ok) throw new Error(loaded.error.detail);
    const s = loaded.state;
    s.hero.screen = 'nif_gate';
    s.hero.x = 20 * 16 + 8;
    s.hero.y = 7 * 16 + 14;
    expect(playM6b(5, s).sim.state.flags.st_d4_kolbeinn).toBe(true);
  }, 240_000);

  it('replays identically', () => {
    expect(playM6b(7).sim.hash()).toBe(playM6b(7).sim.hash());
  }, 480_000);
});
