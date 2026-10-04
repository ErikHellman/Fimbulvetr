import { describe, expect, it } from 'vitest';
import { DEV_PRESETS } from '@content/dev/presets';
import type { ScreenId } from '@content/world/screens';
import { questLog } from '@core/story/quests';
import { tileFeet } from '@core/world/screen';
import { DB } from '@content/index';
import { Harness } from './harness';
import { finishStory, talkTo } from './walk';

function warp(h: Harness, screen: ScreenId, x: number, y: number): Harness {
  const p = tileFeet({ x, y });
  h.sim.command({ t: 'warp', screen, x: p.x, y: p.y });
  return h.idle(2);
}

/** Haugar with both of Styrr's paid lessons learned. */
function taught(): Harness {
  const h = new Harness({ preset: DEV_PRESETS.hau });
  Object.assign(h.sim.state.flags, {
    n_styrr_met: true,
    q_rs3_watch: true,
    st_barrow_open: true,
    t_dash: true,
    t_parry: true,
  });
  return warp(h, 'hau_int_styrr', 19, 13);
}

const styrrDuel = (h: Harness) => h.sim.enemies.find((e) => e.def === 'styrr_duel');

describe('Styrr’s last duel', () => {
  it('is not offered before both techniques are known', () => {
    const h = new Harness({ preset: DEV_PRESETS.hau });
    Object.assign(h.sim.state.flags, { n_styrr_met: true, q_rs3_watch: true, t_dash: true });
    warp(h, 'hau_int_styrr', 19, 13);
    talkTo(h, 'styrr');
    expect(h.sim.state.flags.q_duel_asked).not.toBe(true);
  });

  it('is offered once both are, and fought in the yard: the post moves aside for Styrr', () => {
    const h = taught();
    talkTo(h, 'styrr');
    expect(h.sim.state.flags.q_duel_asked).toBe(true);
    expect(h.sim.state.flags.ev_duel_on).toBe(true);
    warp(h, 'hau_huscarl', 24, 9);
    expect(styrrDuel(h)).toBeDefined();
    expect(h.sim.enemies.some((e) => e.def === 'dummy')).toBe(false);
    expect(h.sim.boss()?.name.en).toBe('Styrr');
    h.expectAnims();
  });

  it('won, teaches Bragð', () => {
    const h = taught();
    talkTo(h, 'styrr');
    warp(h, 'hau_huscarl', 24, 9);
    h.sim.command({ t: 'killAll' });
    h.idle(2);
    expect(h.sim.state.flags.q_duel_won).toBe(true);
    expect(h.sim.mode).toBe('story');
    finishStory(h);
    expect(h.sim.state.inv.galdr).toContain('bragd');
    expect(h.sim.state.flags.st_bragd_learned).toBe(true);
    const log = questLog(DB.quests, { state: h.sim.state, quests: DB.quests });
    expect(log.find((q) => q.id === 'q_huscarl')?.done).toBe(true);
    // Styrr is home again, with something to say about it.
    warp(h, 'hau_int_styrr', 19, 13);
    expect(h.sim.actors.some((a) => a.kind === 'npc' && a.def === 'styrr')).toBe(true);
  });

  it('left, is forfeit: Styrr is back in his cottage and the duel can be asked for again', () => {
    const h = taught();
    talkTo(h, 'styrr');
    warp(h, 'hau_huscarl', 24, 9);
    warp(h, 'hau_circle', 20, 10);
    expect(h.sim.state.flags.ev_duel_on).toBe(false);
    warp(h, 'hau_huscarl', 24, 9);
    expect(styrrDuel(h)).toBeUndefined();
  });
});
