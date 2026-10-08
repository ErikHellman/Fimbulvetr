import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { SCREEN_IDS } from '@content/world/screens';
import { Sim } from '@core/sim/sim';
import { loadSave, type SaveData } from '@core/state/save';
import { summarize } from '@shell/platform/saveStore';
import { summaryLine } from '@shell/ui/slotText';
import { frameOf } from './harness';

/**
 * The save committed at version 1.0.0 (M11b, still format v1): the M11a save walked out of the longhouse
 * into the farmyard on the evening of the spring feast. Every later build must keep loading it.
 */
describe('v1-m11b fixture', () => {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m11b.json', import.meta.url), 'utf8'),
  );
  const result = loadSave(raw, new Set<string>(SCREEN_IDS));

  it('loads with a valid checksum', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(result.checksumOk).toBe(true);
    expect(result.state.hero.screen).toBe('ask_farmyard');
    expect(result.state.flags).toMatchObject({ st_game_done: true, q_record_done: true, q_feast_done: true });
  });

  it('shows the othala rune on its slot line, and runs', () => {
    if (!result.ok) throw new Error(result.error.detail);
    expect(summaryLine(summarize(raw as SaveData), DB, 'en')).toMatch(/^ᛟ /);
    const sim = new Sim(DB, result.state);
    for (let i = 0; i < 120; i++) sim.step(frameOf([]));
    expect(sim.mode).toBe('play');
  });
});
