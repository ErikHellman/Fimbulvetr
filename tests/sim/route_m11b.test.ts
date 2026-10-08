import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SCREEN_IDS } from '@content/world/screens';
import type { GameState } from '@core/state/gameState';
import { loadSave } from '@core/state/save';
import { playM11b } from './routes/m11b';

/** The M11a save: in the longhouse after the spring feast. */
function m11a(): GameState {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m11a.json', import.meta.url), 'utf8'),
  );
  const loaded = loadSave(raw, new Set<string>(SCREEN_IDS));
  if (!loaded.ok) throw new Error(loaded.error.detail);
  return loaded.state;
}

describe('M11b route', () => {
  it('walks from the feast out into the farmyard, and replays the same', () => {
    const a = playM11b(m11a());
    expect(a.sim.screen.id).toBe('ask_farmyard');
    expect(a.sim.state.flags.st_game_done).toBe(true);
    const b = playM11b(m11a());
    expect(b.sim.tick).toBe(a.sim.tick);
    expect(b.sim.snapshot()).toEqual(a.sim.snapshot());
  });
});
