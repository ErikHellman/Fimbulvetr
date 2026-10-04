import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import type { FlagId } from '@content/flags';
import type { NpcId } from '@content/ids';
import type { ScreenId } from '@content/world/screens';
import { evalCond } from '@core/story/cond';
import { questLog } from '@core/story/quests';
import { tileFeet } from '@core/world/screen';
import { Harness } from './harness';
import { finishStory, talkTo } from './walk';

function warp(h: Harness, screen: ScreenId, x: number, y: number): Harness {
  const p = tileFeet({ x, y });
  h.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
  return h.idle(2);
}

/** After M4 (the third stone lit), with the pass open or not. */
function after(open: boolean): Harness {
  const h = new Harness({ preset: DEV_PRESETS.haubow });
  if (open) Object.assign(h.sim.state.flags, { st_pass_open: true });
  return h;
}

const arts = (h: Harness, art: string) => h.sim.actors.filter((a) => a.art === art).length;

const fimbulvetr = (h: Harness) =>
  questLog(DB.quests, { state: h.sim.state, quests: DB.quests }).find((q) => q.id === 'q_fimbulvetr');

describe('Askdalr after the raid', () => {
  it('keeps its ruins until the farm is rebuilt: the scorched roof, the burned fold, the shut houses', () => {
    const h = after(false);
    warp(h, 'ask_farmyard', 20, 18);
    expect(arts(h, 'fix_scorch')).toBeGreaterThan(0);
    expect(arts(h, 'fix_rubble')).toBeGreaterThan(0);
    h.sim.state.flags.q_farm = 1;
    warp(h, 'ask_farmyard', 20, 18);
    expect(arts(h, 'fix_scorch')).toBe(0);
    expect(arts(h, 'fix_rubble')).toBeGreaterThan(0);
    h.sim.state.flags.q_farm = 2;
    warp(h, 'ask_farmyard', 20, 18);
    expect(arts(h, 'fix_rubble')).toBe(0);
    warp(h, 'ask_village', 20, 18);
    expect(arts(h, 'fix_boards')).toBe(3);
    h.expectAnims();
  });

  it('has no ruins before the raid', () => {
    const h = new Harness({ preset: DEV_PRESETS.day2 });
    warp(h, 'ask_farmyard', 20, 18);
    expect(arts(h, 'fix_scorch') + arts(h, 'fix_rubble')).toBe(0);
    warp(h, 'ask_village', 20, 18);
    expect(arts(h, 'fix_boards')).toBe(0);
  });
});

describe('coming home in the Fimbulvetr', () => {
  it('starts at the third stone and ends with the road north buried in rime', () => {
    const h = after(false);
    expect(fimbulvetr(h)?.done).toBe(false);
    h.sim.state.flags.st_pass_open = true;
    warp(h, 'ask_farmyard', 20, 18);
    expect(h.sim.mode).toBe('story');
    finishStory(h);
    expect(h.sim.state.flags.st_home_winter).toBe(true);
    // Once only.
    warp(h, 'ask_village', 20, 18);
    warp(h, 'ask_farmyard', 20, 18);
    expect(h.sim.mode).toBe('play');

    warp(h, 'ask_int_longhouse', 27, 12);
    talkTo(h, 'halvar');
    expect(fimbulvetr(h)?.done).toBe(false);
    warp(h, 'ask_int_hof', 20, 14);
    talkTo(h, 'gyda');
    expect(h.sim.state.flags.st_blood_told).toBe(true);
    const q = fimbulvetr(h);
    expect(q?.done).toBe(true);
    expect(q?.text.en).toBe('The pass is open, but the road north is buried in rime.');
  });

  it('gives each of the named people a new line once the pass is open', () => {
    const PEOPLE: readonly NpcId[] = [
      'halvar',
      'gyda',
      'sigrun',
      'grimr',
      'thordis',
      'solvi',
      'steinn',
      'ragna',
      'hrafnkell',
      'heidr',
      'kari',
      'bardr',
      'styrr',
      'hildr',
      'geirmundr',
      'hallsteinn',
    ];
    const opening = (open: boolean, npc: NpcId): string | undefined => {
      const h = after(false);
      const flags = h.sim.state.flags;
      for (const f of Object.keys(DB.flags) as FlagId[]) if (f.startsWith('n_')) flags[f] = true;
      Object.assign(flags, { w_horn_thordis: true, q_duel_asked: true });
      if (open) Object.assign(flags, { st_pass_open: true, st_home_winter: true });
      const def = DB.dialogue[npc];
      return def?.entry.find((e) => evalCond(e.when, { state: h.sim.state, quests: DB.quests }))?.node;
    };
    for (const npc of PEOPLE) expect(opening(true, npc), npc).not.toBe(opening(false, npc));
  });

  it('has Bárðr refuse the frozen lake', () => {
    const def = DB.dialogue.bardr;
    const texts = Object.values(def?.nodes ?? {}).map((n) => n.text.en);
    expect(texts).toContain(
      'The lake froze in one night. I will not row on that, and I will not walk it yet.',
    );
  });
});
