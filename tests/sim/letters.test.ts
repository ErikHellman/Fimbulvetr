import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import { questLog } from '@core/story/quests';
import { evalCond } from '@core/story/cond';
import type { NpcId } from '@content/ids';
import { Harness, frameOf } from './harness';
import { face, finishStory, talkTo, walkTo } from './walk';

const quest = (h: Harness) =>
  questLog(DB.quests, { state: h.sim.state, quests: DB.quests }).find((q) => q.id === 'q_letters');

describe('Embla’s first letter', () => {
  it('is given at the Refuge after the meeting, and leads to a seiðr vessel in Myrkviðr’s glade', () => {
    const h = new Harness({
      preset: DEV_PRESETS.fimbul,
      screen: 'ref_int_hall',
      tile: [18, 15],
      minute: 12 * 60,
    });
    Object.assign(h.sim.state.flags, { st_pass_open: true, st_embla_found: true });
    // People are placed as a screen loads, so step back into the hall once the flags hold.
    h.sim.command({ t: 'warp', screen: 'ref_int_hall', x: 18 * 16 + 8, y: 15 * 16 + 14 });
    h.idle(2);
    talkTo(h, 'embla');
    expect(h.sim.state.flags.q_letters).toBe(1);
    expect(quest(h)?.text.en).toMatch(/glade/);
    const before = h.sim.state.inv.items.seidr_upgrade ?? 0;
    h.sim.command({ t: 'warp', screen: 'myr_glade', x: 8 * 16 + 8, y: 8 * 16 + 14 });
    h.idle(2);
    walkTo(h, 8, 7);
    face(h, 'n');
    h.step(frameOf([], ['interact']));
    finishStory(h);
    expect(h.sim.state.inv.items.seidr_upgrade).toBe(before + 1);
    expect(h.sim.state.flags.st_letter1_found).toBe(true);
    // Once only.
    face(h, 'n');
    h.step(frameOf([], ['interact']));
    finishStory(h);
    expect(h.sim.state.inv.items.seidr_upgrade).toBe(before + 1);
  });

  it('keeps the pine in the glade empty before the letter', () => {
    const h = new Harness({ preset: DEV_PRESETS.fimbul, screen: 'myr_glade', tile: [8, 7], minute: 12 * 60 });
    face(h, 'n');
    h.step(frameOf([], ['interact']));
    finishStory(h);
    expect(h.sim.state.flags.st_letter1_found).toBeUndefined();
  });
});

describe('the lowlands hear of the lake', () => {
  // Each of these has one new line once Ask has the seal-skin or has found Embla.
  const LINES: readonly [NpcId, string][] = [
    ['halvar', 'embla'],
    ['gyda', 'embla'],
    ['hildr', 'skin'],
    ['solvi', 'embla'],
    ['kari', 'skin'],
    ['ragna', 'embla'],
    ['eyvindr', 'skin'],
  ];
  it.each(LINES)('%s has a %s line', (npc, node) => {
    const def = DB.dialogue[npc];
    expect(def?.nodes[node]).toBeDefined();
    const h = new Harness({ preset: DEV_PRESETS.fimbul, minute: 20 * 60 });
    Object.assign(h.sim.state.flags, {
      st_rime_open: true,
      q_sealskin_done: true,
      st_embla_found: true,
      n_hildr_met: true,
      n_solvi_met: true,
      n_kari_met: true,
      n_ragna_met: true,
      n_eyvindr_met: true,
      st_hlif_learned: true,
    });
    const ctx = { state: h.sim.state, quests: DB.quests };
    const first = def?.entry.find((e) => evalCond(e.when, ctx));
    expect(first?.node).toBe(node);
  });
});
