import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import type { NpcId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import { evalCond } from '@core/story/cond';
import { questLog } from '@core/story/quests';
import { tileFeet } from '@core/world/screen';
import { Harness } from './harness';
import { talkTo } from './walk';

function warp(h: Harness, screen: ScreenId, x: number, y: number): Harness {
  const p = tileFeet({ x, y });
  h.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
  return h.idle(2);
}

const quest = (h: Harness) =>
  questLog(DB.quests, { state: h.sim.state, quests: DB.quests }).find((q) => q.id === 'q_steinn');

/** Talks to `npc` wherever the NPC stands now (the first place whose condition holds). */
function visit(h: Harness, npc: NpcId): void {
  const ctx = { state: h.sim.state, quests: DB.quests };
  const place = DB.npcs[npc]?.places.find((p) => evalCond(p.when, ctx));
  if (place === undefined) throw new Error(`${npc} is nowhere`);
  warp(h, place.screen, place.at.x, place.at.y + 3);
  talkTo(h, npc);
}

describe('Steinn’s clasp (q_steinn)', () => {
  it('carries the clasp to Halvar and his answer back, for 150 silver', () => {
    const h = new Harness({ preset: DEV_PRESETS.fimbul });
    Object.assign(h.sim.state.flags, { st_home_winter: true, st_blood_told: true, n_steinn_met: true });
    h.sim.state.hero.silver = 0;
    h.sim.state.hero.purse = 1;
    visit(h, 'steinn');
    expect(h.sim.state.inv.items.mail_clasp).toBe(1);
    expect(quest(h)?.done).toBe(false);
    visit(h, 'halvar');
    expect(h.sim.state.inv.items.mail_clasp ?? 0).toBe(0);
    expect(h.sim.state.flags.q_steinn_answer).toBe(true);
    visit(h, 'steinn');
    expect(h.sim.state.hero.silver).toBe(150);
    expect(h.sim.state.flags.q_steinn_done).toBe(true);
    expect(quest(h)?.done).toBe(true);
  });
});
