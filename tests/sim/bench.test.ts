import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS, type ScreenId } from '@content/world/screens';
import { loadSave } from '@core/state/save';
import type { TilePos } from '@core/world/screen';
import { tileFeet } from '@core/world/screen';
import { Harness, frameOf } from './harness';

/**
 * The sim benchmark (M11b): from the M10a save (Útgarðr open, most of the world awake), the busiest
 * screens by actors on stage each run ten seconds of play. The budget is generous so a slow CI runner
 * does not flake, but a regression of an order of magnitude fails.
 */
const TICKS = 600;
const BUSIEST = 6;
/** Milliseconds per simulated tick, worst screen. 60 ticks a second leave 16.7 ms a frame in all. */
const BUDGET_MS = 2;

function arrival(screen: ScreenId): TilePos | null {
  for (const id of SCREEN_IDS)
    for (const t of DB.screens[id].things) if (t.k === 'door' && t.to === screen) return t.arrive;
  return DB.screens[screen].spawns?.[0] ?? null;
}

describe('sim benchmark', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m10a.json', import.meta.url), 'utf8'),
  );
  const loaded = loadSave(raw, new Set<string>(SCREEN_IDS));
  if (!loaded.ok) throw new Error(loaded.error.detail);
  const from = loaded.state;

  function on(screen: ScreenId, at: TilePos): Harness {
    const h = new Harness({ state: from });
    const p = tileFeet(at);
    h.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
    h.idle(2);
    return h;
  }

  it(`runs the ${String(BUSIEST)} busiest screens within ${String(BUDGET_MS)} ms a tick`, () => {
    const crowd: { screen: ScreenId; at: TilePos; actors: number }[] = [];
    for (const screen of SCREEN_IDS) {
      if (screen.startsWith('test_')) continue;
      const at = arrival(screen);
      if (at === null) continue;
      crowd.push({ screen, at, actors: on(screen, at).sim.actors.length });
    }
    crowd.sort((a, b) => b.actors - a.actors || a.screen.localeCompare(b.screen));
    const rows: string[] = [];
    let worst = 0;
    for (const { screen, at, actors } of crowd.slice(0, BUSIEST)) {
      const h = on(screen, at);
      const start = performance.now();
      for (let i = 0; i < TICKS; i++) {
        if (h.sim.mode === 'over') h.sim.command({ t: 'warp', screen, x: tileFeet(at).x, y: tileFeet(at).y });
        h.step(frameOf([]));
      }
      const ms = (performance.now() - start) / TICKS;
      worst = Math.max(worst, ms);
      rows.push(`${screen} ${String(actors)} actors ${ms.toFixed(3)} ms/tick`);
    }
    process.stdout.write(`sim benchmark\n${rows.join('\n')}\n`);
    expect(worst).toBeLessThan(BUDGET_MS);
  });
});
