import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import type { NpcId } from '@content/ids';
import { SCREEN_IDS, type ScreenId } from '@content/world/screens';
import { loadSave } from '@core/state/save';
import type { GameState } from '@core/state/gameState';
import { evalCond } from '@core/story/cond';
import { questLog } from '@core/story/quests';
import { tileFeet } from '@core/world/screen';
import { Harness } from './harness';
import { finishStory, interactNorth, talkTo } from './walk';

function warp(h: Harness, screen: ScreenId, x: number, y: number): Harness {
  const p = tileFeet({ x, y });
  h.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
  return h.idle(2);
}

const quest = (h: Harness) =>
  questLog(DB.quests, { state: h.sim.state, quests: DB.quests }).find((q) => q.id === 'q_feast');

function visit(h: Harness, npc: NpcId): void {
  const ctx = { state: h.sim.state, quests: DB.quests };
  const place = DB.npcs[npc]?.places.find((p) => evalCond(p.when, ctx));
  if (place === undefined) throw new Error(`${npc} is nowhere`);
  warp(h, place.screen, place.at.x, place.at.y + 2);
  talkTo(h, npc);
}

function after(): GameState {
  const raw: unknown = JSON.parse(
    readFileSync(new URL('../fixtures/saves/v1-m10b.json', import.meta.url), 'utf8'),
  );
  const r = loadSave(raw, new Set<string>(SCREEN_IDS));
  if (!r.ok) throw new Error(r.error.detail);
  return r.state;
}

describe('the spring feast (q_feast)', () => {
  it('is asked for after the ending, gathered from three hosts, and held at the longhouse table', () => {
    const h = new Harness({ state: after() });
    expect(quest(h)).toBeUndefined();
    visit(h, 'halvar');
    expect(h.sim.state.flags.q_feast_asked).toBe(true);
    expect(quest(h)?.done).toBe(false);
    // The table is bare until all three are brought.
    warp(h, 'ask_int_longhouse', 26, 17);
    interactNorth(h, 26, 15);
    expect(h.sim.mode).toBe('play');
    // Sigrún is spoken to across her counter.
    warp(h, 'ask_int_trader', 19, 14);
    interactNorth(h, 19, 11);
    finishStory(h);
    for (const npc of ['kari', 'dvalinn'] as const) visit(h, npc);
    expect(h.sim.state.flags).toMatchObject({ q_feast_mead: true, q_feast_fish: true, q_feast_cask: true });
    const pieces = h.sim.state.world.pieces.length;
    warp(h, 'ask_int_longhouse', 26, 17);
    interactNorth(h, 26, 15);
    expect(h.sim.mode).toBe('story');
    finishStory(h);
    expect(h.sim.state.flags.q_feast_done).toBe(true);
    expect(h.sim.state.world.pieces).toContain('hp_feast');
    expect(h.sim.state.world.pieces).toHaveLength(pieces + 1);
    expect(quest(h)?.done).toBe(true);
    expect(h.sim.screen.id).toBe('ask_int_longhouse');
  });
});
