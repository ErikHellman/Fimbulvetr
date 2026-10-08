import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCREEN_IDS } from '@content/world/screens';
import { loadSave } from '@core/state/save';
import { playM7a } from './routes/m7a';

describe('M7a route', () => {
  it('plays from Hrafn’s door through the seal-skin nights to Holmr and Embla’s first letter', () => {
    const h = playM7a(5);
    const c = h.sim.state.clock;
    console.log(
      `M7a route: ${String(h.sim.tick)} ticks (${(h.sim.tick / 3600).toFixed(1)} min of perfect play), day ${String(c.day)} ${String(Math.floor(c.minute / 60))}:${String(c.minute % 60).padStart(2, '0')}, hp ${String(h.sim.hero.hp)}/${String(h.sim.hero.maxHp)}`,
    );
  }, 240_000);

  it('plays on from the M6b save, at the gate of Helgrind', () => {
    const raw: unknown = JSON.parse(
      readFileSync(new URL('../fixtures/saves/v1-m6b.json', import.meta.url), 'utf8'),
    );
    const loaded = loadSave(raw, new Set<string>(SCREEN_IDS));
    if (!loaded.ok) throw new Error(loaded.error.detail);
    expect(playM7a(5, loaded.state).sim.state.flags.st_embla_found).toBe(true);
  }, 240_000);

  it('replays identically', () => {
    expect(playM7a(7).sim.hash()).toBe(playM7a(7).sim.hash());
  }, 480_000);
});
