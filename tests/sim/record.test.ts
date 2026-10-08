import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import type { NpcId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
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
  questLog(DB.quests, { state: h.sim.state, quests: DB.quests }).find((q) => q.id === 'q_record');

function visit(h: Harness, npc: NpcId): void {
  const ctx = { state: h.sim.state, quests: DB.quests };
  const place = DB.npcs[npc]?.places.find((p) => evalCond(p.when, ctx));
  if (place === undefined) throw new Error(`${npc} is nowhere`);
  warp(h, place.screen, place.at.x, place.at.y + 3);
  talkTo(h, npc);
}

/** The four bauta-stones: screen, and the stone's tile (read from the tile south of it). */
export const BAUTAS: readonly (readonly [ScreenId, number, number])[] = [
  ['myr_road', 16, 7],
  ['hau_circle', 10, 9],
  ['sae_landing', 32, 10],
  ['hrf_cairn', 24, 9],
];

function read(h: Harness, [screen, x, y]: readonly [ScreenId, number, number]): void {
  warp(h, screen, x, y + 1);
  interactNorth(h, x, y);
  expect(h.sim.mode, `${screen} stone`).toBe('story');
  finishStory(h);
}

describe('the rune-record (q_record)', () => {
  it('starts when Gyða hears of Halvar, counts each stone once, and pays a heart piece', () => {
    const h = new Harness({ preset: DEV_PRESETS.d8king });
    expect(quest(h)).toBeUndefined();
    visit(h, 'gyda');
    expect(h.sim.state.flags.q_record_asked).toBe(true);
    expect(quest(h)?.done).toBe(false);
    for (const b of BAUTAS) read(h, b);
    read(h, BAUTAS[0] ?? ['myr_road', 16, 7]);
    expect(h.sim.state.flags.q_record).toBe(4);
    const pieces = h.sim.state.world.pieces.length;
    visit(h, 'gyda');
    expect(h.sim.state.flags.q_record_done).toBe(true);
    expect(h.sim.state.world.pieces).toContain('hp_record');
    expect(h.sim.state.world.pieces).toHaveLength(pieces + 1);
    expect(quest(h)?.done).toBe(true);
  });
});
