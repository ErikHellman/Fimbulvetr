import { describe, expect, it } from 'vitest';
import { DB } from '@content/index';
import { DEV_PRESETS } from '@content/dev/presets';
import type { FlagId } from '@content/flags';
import type { NpcId } from '@content/ids';
import { evalCond } from '@core/story/cond';
import { Harness, frameOf } from './harness';
import { heroTile, walkTo } from './walk';

/** Where M5a leaves Ask (the pass open, winter, Eldr known), walked up the gorge to below the rime. */
function belowTheRime(): Harness {
  const h = new Harness({ preset: DEV_PRESETS.fimbul });
  walkTo(h, 20, 3);
  h.press(['up']).idle(2);
  return h;
}

const rime = (h: Harness) => h.sim.actors.filter((a) => a.def === 'gate' && a.art === 'fix_rime');

describe('the rime wall', () => {
  it('stands against the sword', () => {
    const h = belowTheRime();
    h.press(['sword']).idle(40);
    expect(h.sim.state.flags.st_rime_open).not.toBe(true);
    expect(rime(h).every((g) => g.anim === 'closed')).toBe(true);
  });

  it('melts under Eldr, and the gorge goes on north into Niflmýrr', () => {
    const h = belowTheRime();
    h.press(['galdr']).idle(60);
    expect(h.sim.state.flags.st_rime_open).toBe(true);
    expect(h.events).toContainEqual({ t: 'sfx', id: 'sfx_melt' });
    expect(h.events.some((e) => e.t === 'shake')).toBe(true);
    expect(rime(h).every((g) => g.anim === 'open')).toBe(true);
    h.until((s) => s.screen.id !== 'hau_pass', 300, frameOf(['up']));
    h.idle(40);
    expect(h.sim.screen.id).toBe('nif_gorge');
    expect(heroTile(h.sim)[1]).toBeGreaterThan(16);
    h.expectAnims();
  });

  it('stays melted after a reload', () => {
    const h = belowTheRime();
    h.press(['galdr']).idle(60);
    const again = new Harness({ state: h.sim.snapshot() });
    expect(again.sim.state.flags.st_rime_open).toBe(true);
  });
});

describe('after the rime', () => {
  it('gives Gyða, Sölvi, Styrr, Hallsteinn and Kári a new line', () => {
    const opening = (melted: boolean, npc: NpcId): string | undefined => {
      const h = new Harness({ preset: DEV_PRESETS.fimbul });
      const flags = h.sim.state.flags;
      for (const f of Object.keys(DB.flags) as FlagId[]) if (f.startsWith('n_')) flags[f] = true;
      Object.assign(flags, { st_hlif_learned: true, q_duel_won: true, st_rime_open: melted });
      const def = DB.dialogue[npc];
      return def?.entry.find((e) => evalCond(e.when, { state: h.sim.state, quests: DB.quests }))?.node;
    };
    for (const npc of ['gyda', 'solvi', 'styrr', 'hallsteinn', 'kari'] as const)
      expect(opening(true, npc), npc).not.toBe(opening(false, npc));
  });
});
